import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal, get_db
from models import Job
from pipeline import discovery, extraktion, landing_generator, outreach

router = APIRouter()
logger = logging.getLogger(__name__)

# Track active full-pipeline job to prevent concurrent runs
_active_full_job_id: Optional[int] = None
_active_tasks: dict[int, asyncio.Task] = {}


# ── Request schemas ───────────────────────────────────────────────────────────

class DiscoveryRequest(BaseModel):
    branche: str
    kanton: str = ""
    max_per_search: int = 100


class ExtraktionRequest(BaseModel):
    place_id: Optional[str] = None


class LandingRequest(BaseModel):
    place_id: Optional[str] = None


class FullRequest(BaseModel):
    branche: str
    kanton: str = ""
    max_per_search: int = 100


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _create_job(db: AsyncSession, typ: str) -> Job:
    job = Job(typ=typ, status="laufend", log="")
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


def _job_to_dict(job: Job) -> dict:
    return {
        "id": job.id,
        "typ": job.typ,
        "status": job.status,
        "total": job.total,
        "verarbeitet": job.verarbeitet,
        "fehler": job.fehler,
        "log": job.log,
        "gestartet_am": job.gestartet_am.isoformat() if job.gestartet_am else None,
        "abgeschlossen_am": job.abgeschlossen_am.isoformat() if job.abgeschlossen_am else None,
    }


def _start_task(job_id: int, coro) -> asyncio.Task:
    task = asyncio.create_task(coro)
    _active_tasks[job_id] = task

    async def _cleanup(t):
        await t
        _active_tasks.pop(job_id, None)

    asyncio.create_task(_cleanup(task))
    return task


# ── Individual pipeline steps ─────────────────────────────────────────────────

@router.post("/discovery/start")
async def start_discovery(req: DiscoveryRequest, db: AsyncSession = Depends(get_db)):
    job = await _create_job(db, "discovery")
    _start_task(job.id, discovery.run(job.id, req.branche, req.kanton, req.max_per_search))
    return {"job_id": job.id, "message": "Discovery gestartet"}


@router.post("/extraktion/start")
async def start_extraktion(req: ExtraktionRequest, db: AsyncSession = Depends(get_db)):
    job = await _create_job(db, "extraktion")
    _start_task(job.id, extraktion.run(job.id, req.place_id))
    return {"job_id": job.id, "message": "Extraktion gestartet"}


@router.post("/landing/start")
async def start_landing(req: LandingRequest, db: AsyncSession = Depends(get_db)):
    job = await _create_job(db, "landing")
    _start_task(job.id, landing_generator.run(job.id, req.place_id))
    return {"job_id": job.id, "message": "Landing-Generierung gestartet"}


@router.post("/outreach/start")
async def start_outreach(db: AsyncSession = Depends(get_db)):
    job = await _create_job(db, "outreach")
    _start_task(job.id, outreach.run(job.id))
    return {"job_id": job.id, "message": "Outreach gestartet"}


# ── Combined runs ─────────────────────────────────────────────────────────────

@router.post("/discovery-extraktion/start")
async def start_discovery_extraktion(req: DiscoveryRequest, db: AsyncSession = Depends(get_db)):
    job = await _create_job(db, "discovery+extraktion")

    async def _run():
        await discovery.run(job.id, req.branche, req.kanton, req.max_per_search, final_step=False)
        await extraktion.run(job.id, final_step=True)

    _start_task(job.id, _run())
    return {"job_id": job.id, "message": "Discovery + Extraktion gestartet"}


@router.post("/extraktion-landing/start")
async def start_extraktion_landing(req: ExtraktionRequest, db: AsyncSession = Depends(get_db)):
    job = await _create_job(db, "extraktion+landing")

    async def _run():
        await extraktion.run(job.id, req.place_id, final_step=False)
        await landing_generator.run(job.id, final_step=True)

    _start_task(job.id, _run())
    return {"job_id": job.id, "message": "Extraktion + Landing gestartet"}


@router.post("/full/start")
async def start_full(req: FullRequest, db: AsyncSession = Depends(get_db)):
    global _active_full_job_id
    if _active_full_job_id and _active_full_job_id in _active_tasks:
        raise HTTPException(status_code=409, detail="Full-Pipeline läuft bereits")

    job = await _create_job(db, "full")
    _active_full_job_id = job.id

    async def _run():
        global _active_full_job_id
        try:
            await discovery.run(job.id, req.branche, req.kanton, req.max_per_search, final_step=False)
            await extraktion.run(job.id, final_step=False)
            await landing_generator.run(job.id, final_step=False)
            await outreach.run(job.id, final_step=True)
        finally:
            _active_full_job_id = None

    _start_task(job.id, _run())
    return {"job_id": job.id, "message": "Full-Pipeline gestartet"}


# ── Job management ────────────────────────────────────────────────────────────

@router.get("/jobs")
async def list_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).order_by(desc(Job.id)).limit(20))
    jobs = result.scalars().all()
    return [_job_to_dict(j) for j in jobs]


@router.get("/jobs/{job_id}")
async def get_job(job_id: int, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job nicht gefunden")
    return _job_to_dict(job)


@router.patch("/jobs/{job_id}/cancel")
async def cancel_job(job_id: int, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job nicht gefunden")
    job.status = "fehler"
    job.fehler = (job.fehler or 0)
    job.log = (job.log or "") + "\n[Manuell abgebrochen]"
    job.abgeschlossen_am = datetime.now(timezone.utc)
    await db.commit()
    # Cancel asyncio task if running
    task = _active_tasks.pop(job_id, None)
    if task:
        task.cancel()
    return {"message": "Job abgebrochen"}


# ── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/ws/jobs/{job_id}")
async def websocket_job_status(websocket: WebSocket, job_id: int):
    await websocket.accept()
    try:
        while True:
            async with AsyncSessionLocal() as db:
                job = await db.get(Job, job_id)
                if not job:
                    await websocket.send_json({"error": "Job nicht gefunden"})
                    break
                data = _job_to_dict(job)
                await websocket.send_json(data)
                if job.status in ("abgeschlossen", "fehler"):
                    break
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("WebSocket error for job %d: %s", job_id, e)
