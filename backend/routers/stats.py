from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Betrieb, Kontaktversuch

router = APIRouter()


@router.get("/coldcall")
async def coldcall_stats(db: AsyncSession = Depends(get_db)):
    # Gesamt
    total = (await db.execute(select(func.count()).select_from(Betrieb))).scalar() or 0

    # Nach Lead-Status
    rows = await db.execute(
        select(Betrieb.lead_status, func.count()).group_by(Betrieb.lead_status)
    )
    nach_status = {r[0] or "unbekannt": r[1] for r in rows}

    # Nach Agent
    rows = await db.execute(
        select(Betrieb.agent, func.count()).group_by(Betrieb.agent)
    )
    nach_agent = {(r[0] or "Nicht zugewiesen"): r[1] for r in rows}

    # Nach Branche (Top 8)
    rows = await db.execute(
        select(Betrieb.branche, func.count())
        .where(Betrieb.branche.isnot(None))
        .group_by(Betrieb.branche)
        .order_by(func.count().desc())
        .limit(8)
    )
    nach_branche = {r[0]: r[1] for r in rows}

    # Aktivität letzte 14 Tage (Notizen + Anrufe)
    since = datetime.now(timezone.utc) - timedelta(days=14)
    rows = await db.execute(
        select(
            func.date(Kontaktversuch.gesendet_am).label("tag"),
            func.count(),
        )
        .where(
            Kontaktversuch.typ.in_(["anruf", "notiz"]),
            Kontaktversuch.gesendet_am >= since,
        )
        .group_by(func.date(Kontaktversuch.gesendet_am))
        .order_by(func.date(Kontaktversuch.gesendet_am))
    )
    aktivitaet = {str(r[0]): r[1] for r in rows}

    # Gesamt Demos + Verkauft
    demos = (await db.execute(
        select(func.count()).where(Betrieb.status == "landing_generiert")
    )).scalar() or 0
    verkauft = (await db.execute(
        select(func.count()).where(Betrieb.lead_status == "verkauft")
    )).scalar() or 0

    return {
        "total": total,
        "demos": demos,
        "verkauft": verkauft,
        "nach_status": nach_status,
        "nach_agent": nach_agent,
        "nach_branche": nach_branche,
        "aktivitaet_14d": aktivitaet,
    }
