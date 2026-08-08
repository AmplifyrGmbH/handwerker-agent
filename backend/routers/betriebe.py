from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func, cast, Date, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import asyncio

from config import settings
from database import get_db, AsyncSessionLocal
from models import Betrieb, Kontaktversuch, Job
from pipeline import landing_generator
from services import gemini_client, r2_client

router = APIRouter()

VALID_LEAD_STATUSES = {
    "nicht_angerufen",
    "nicht_erreicht",
    "callback",
    "demo_gewuenscht",
    "kein_interesse",
}


# ── Schemas ───────────────────────────────────────────────────────────────────

class BetriebPatch(BaseModel):
    email: Optional[str] = None
    optout: Optional[bool] = None
    status: Optional[str] = None
    lead_status: Optional[str] = None
    agent: Optional[str] = None


class AnrufRequest(BaseModel):
    notizen: str = ""
    ergebnis: str  # nicht_erreicht | callback | demo_gewuenscht | kein_interesse
    callback_datum: Optional[str] = None  # ISO-8601


class DemoSendenRequest(BaseModel):
    email: Optional[str] = None  # überschreibt betrieb.email falls gesetzt


class NotizRequest(BaseModel):
    text: str


class DemoBearbeitenRequest(BaseModel):
    prompt: str


# ── Serialisierung ────────────────────────────────────────────────────────────

def _kontaktversuch_to_dict(k: Kontaktversuch) -> dict:
    return {
        "id": k.id,
        "typ": k.typ,
        "notizen": k.notizen,
        "callback_datum": k.callback_datum.isoformat() if k.callback_datum else None,
        "email_adresse": k.email_adresse,
        "email_subject": k.email_subject,
        "gesendet_am": k.gesendet_am.isoformat() if k.gesendet_am else None,
    }


def _betrieb_to_dict(b: Betrieb, include_kontaktversuche: bool = False) -> dict:
    d = {
        "place_id": b.place_id,
        "name": b.name,
        "name_anzeige": b.name_anzeige,
        "adresse": b.adresse,
        "plz": b.plz,
        "ort": b.ort,
        "kanton": b.kanton,
        "telefon": b.telefon,
        "email": b.email,
        "website_url": b.website_url,
        "website_domain": b.website_domain,
        "keine_website": b.keine_website,
        "google_rating": float(b.google_rating) if b.google_rating else None,
        "google_anzahl": b.google_anzahl,
        "branche": b.branche,
        "status": b.status,
        "lead_status": b.lead_status,
        "inhaber_name": b.inhaber_name,
        "mitarbeiter": b.mitarbeiter,
        "farbe_primary": b.farbe_primary,
        "hat_logo": b.hat_logo,
        "logo_url": b.logo_url,
        "firmenprofil": b.firmenprofil,
        "slug": b.slug,
        "landing_url": b.landing_url,
        "agent": b.agent,
        "letzte_notiz": b.letzte_notiz,
        "letzte_notiz_am": b.letzte_notiz_am.isoformat() if b.letzte_notiz_am else None,
        "optout": b.optout,
        "fehler_log": b.fehler_log,
        "entdeckt_am": b.entdeckt_am.isoformat() if b.entdeckt_am else None,
        "extrahiert_am": b.extrahiert_am.isoformat() if b.extrahiert_am else None,
        "landing_generiert_am": b.landing_generiert_am.isoformat() if b.landing_generiert_am else None,
        "letzter_kontakt_am": b.letzter_kontakt_am.isoformat() if b.letzter_kontakt_am else None,
    }
    if include_kontaktversuche and b.kontaktversuche is not None:
        d["kontaktversuche"] = [_kontaktversuch_to_dict(k) for k in b.kontaktversuche]
    return d


# ── Entdeckt-Daten ────────────────────────────────────────────────────────────

@router.get("/entdeckt-daten")
async def entdeckt_daten(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(distinct(cast(Betrieb.entdeckt_am, Date)))
        .where(Betrieb.entdeckt_am.isnot(None))
        .order_by(cast(Betrieb.entdeckt_am, Date).desc())
    )
    dates = [str(d) for d in result.scalars().all()]
    return dates


# ── List / Detail ─────────────────────────────────────────────────────────────

@router.get("")
async def list_betriebe(
    status: Optional[str] = None,
    lead_status: Optional[str] = None,
    agent: Optional[str] = None,
    branche: Optional[str] = None,
    kanton: Optional[str] = None,
    entdeckt_ab: Optional[date] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(Betrieb)
    if status:
        query = query.where(Betrieb.status == status)
    if lead_status:
        query = query.where(Betrieb.lead_status == lead_status)
    if agent:
        query = query.where(Betrieb.agent == agent)
    if branche:
        query = query.where(Betrieb.branche == branche)
    if kanton:
        query = query.where(Betrieb.kanton == kanton)
    if entdeckt_ab:
        query = query.where(Betrieb.entdeckt_am >= datetime.combine(entdeckt_ab, datetime.min.time()))

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    query = query.offset(offset).limit(limit).order_by(Betrieb.entdeckt_am.desc())
    result = await db.execute(query)
    betriebe = result.scalars().all()

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": [_betrieb_to_dict(b) for b in betriebe],
    }


@router.get("/{place_id}")
async def get_betrieb(place_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Betrieb)
        .where(Betrieb.place_id == place_id)
        .options(selectinload(Betrieb.kontaktversuche))
    )
    b = result.scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Betrieb nicht gefunden")
    return _betrieb_to_dict(b, include_kontaktversuche=True)


@router.patch("/{place_id}")
async def patch_betrieb(place_id: str, patch: BetriebPatch, db: AsyncSession = Depends(get_db)):
    b = await db.get(Betrieb, place_id)
    if not b:
        raise HTTPException(status_code=404, detail="Betrieb nicht gefunden")
    if patch.email is not None:
        b.email = patch.email
    if patch.optout is not None:
        b.optout = patch.optout
    if patch.status is not None:
        b.status = patch.status
    if patch.lead_status is not None:
        if patch.lead_status not in VALID_LEAD_STATUSES:
            raise HTTPException(status_code=400, detail=f"Ungültiger lead_status: {patch.lead_status}")
        b.lead_status = patch.lead_status
    if patch.agent is not None:
        b.agent = patch.agent or None
    await db.commit()
    return _betrieb_to_dict(b)


# ── CRM: Anruf dokumentieren ──────────────────────────────────────────────────

@router.post("/{place_id}/anruf")
async def anruf_dokumentieren(
    place_id: str,
    req: AnrufRequest,
    db: AsyncSession = Depends(get_db),
):
    b = await db.get(Betrieb, place_id)
    if not b:
        raise HTTPException(status_code=404, detail="Betrieb nicht gefunden")

    if req.ergebnis not in VALID_LEAD_STATUSES:
        raise HTTPException(status_code=400, detail=f"Ungültiges Ergebnis: {req.ergebnis}")

    callback_dt = None
    if req.callback_datum:
        try:
            callback_dt = datetime.fromisoformat(req.callback_datum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Ungültiges callback_datum (ISO-8601 erwartet)")

    kv = Kontaktversuch(
        place_id=place_id,
        typ="anruf",
        notizen=req.notizen or None,
        callback_datum=callback_dt,
        gesendet_am=datetime.now(timezone.utc),
    )
    db.add(kv)

    b.lead_status = req.ergebnis
    b.letzter_kontakt_am = datetime.now(timezone.utc)
    await db.commit()

    return {"ok": True, "lead_status": b.lead_status}


# ── CRM: Demo generieren ──────────────────────────────────────────────────────

async def _run_demo_job(place_id: str):
    async with AsyncSessionLocal() as db:
        job = Job(typ="landing", status="laufend", log="")
        db.add(job)
        await db.commit()
        await db.refresh(job)
    await landing_generator.run(job.id, place_id=place_id, final_step=True)


@router.post("/{place_id}/demo/generieren")
async def demo_generieren(
    place_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    b = await db.get(Betrieb, place_id)
    if not b:
        raise HTTPException(status_code=404, detail="Betrieb nicht gefunden")
    if b.status not in ("extrahiert", "landing_generiert"):
        raise HTTPException(
            status_code=400,
            detail="Betrieb muss zuerst extrahiert sein (status: extrahiert)"
        )

    background_tasks.add_task(_run_demo_job, place_id)
    return {"ok": True, "message": "Demo-Generierung gestartet"}



# ── CRM: Notiz hinzufügen ─────────────────────────────────────────────────────

@router.post("/{place_id}/notiz")
async def notiz_hinzufuegen(
    place_id: str,
    req: NotizRequest,
    db: AsyncSession = Depends(get_db),
):
    b = await db.get(Betrieb, place_id)
    if not b:
        raise HTTPException(status_code=404, detail="Betrieb nicht gefunden")
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Notiztext darf nicht leer sein")

    now = datetime.now(timezone.utc)
    kv = Kontaktversuch(
        place_id=place_id,
        typ="notiz",
        notizen=req.text.strip(),
        gesendet_am=now,
    )
    db.add(kv)
    b.letzte_notiz = req.text.strip()
    b.letzte_notiz_am = now
    await db.commit()
    return _kontaktversuch_to_dict(kv)


# ── CRM: Demo per KI-Prompt bearbeiten ───────────────────────────────────────

@router.post("/{place_id}/demo/bearbeiten")
async def demo_bearbeiten(
    place_id: str,
    req: DemoBearbeitenRequest,
    db: AsyncSession = Depends(get_db),
):
    b = await db.get(Betrieb, place_id)
    if not b:
        raise HTTPException(status_code=404, detail="Betrieb nicht gefunden")
    if not b.slug or not b.landing_url:
        raise HTTPException(status_code=400, detail="Noch keine Demo generiert")
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt darf nicht leer sein")

    r2_key = f"handwerker/{b.slug}.html"
    try:
        html = await asyncio.get_event_loop().run_in_executor(
            None, r2_client.get_html, r2_key
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo konnte nicht geladen werden: {e}")

    try:
        neues_html = await asyncio.get_event_loop().run_in_executor(
            None, gemini_client.bearbeite_landing, html, req.prompt
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"KI-Bearbeitung fehlgeschlagen: {e}")

    try:
        await asyncio.get_event_loop().run_in_executor(
            None, r2_client.upload_html, neues_html, r2_key
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload fehlgeschlagen: {e}")

    return {"ok": True, "landing_url": b.landing_url}
