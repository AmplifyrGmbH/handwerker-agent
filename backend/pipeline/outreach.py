import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal
from models import Betrieb, Job, Kontaktversuch
from prompts.outreach_prompts import build_emails
from services import instantly_client

logger = logging.getLogger(__name__)


async def _append_log(db: AsyncSession, job_id: int, text: str):
    job = await db.get(Job, job_id)
    if job:
        job.log = (job.log or "") + text + "\n"
        await db.commit()


async def _update_job(db: AsyncSession, job_id: int, **kwargs):
    job = await db.get(Job, job_id)
    if job:
        for k, v in kwargs.items():
            setattr(job, k, v)
        await db.commit()


async def run(job_id: int):
    async with AsyncSessionLocal() as db:
        await _append_log(db, job_id, "Outreach gestartet...")

        result = await db.execute(
            select(Betrieb).where(
                Betrieb.status == "landing_generiert",
                Betrieb.email.isnot(None),
                Betrieb.optout == False,  # noqa: E712
                Betrieb.outreach_status.is_(None),
            )
        )
        betriebe = list(result.scalars().all())

        total = len(betriebe)
        await _update_job(db, job_id, total=total)
        await _append_log(db, job_id, f"{total} Betriebe werden kontaktiert...")

    verarbeitet = 0
    fehler = 0

    for betrieb in betriebe:
        try:
            async with AsyncSessionLocal() as db:
                b = await db.get(Betrieb, betrieb.place_id)
                if not b:
                    continue

                firmenname = b.name_anzeige or b.name
                emails = build_emails(firmenname, b.landing_url)

                campaign_id = instantly_client.get_campaign_id(b.branche or "")
                if not campaign_id:
                    logger.warning("Keine Kampagnen-ID für Branche %s", b.branche)
                    fehler += 1
                    continue

                success = instantly_client.add_contact(
                    email=b.email,
                    campaign_id=campaign_id,
                    firmenname=firmenname,
                    landing_url=b.landing_url,
                    subject=emails["cold_subject"],
                    email_text=emails["cold_body"],
                    followup1_subject=emails["followup1_subject"],
                    followup1_text=emails["followup1_body"],
                    followup2_subject=emails["followup2_subject"],
                    followup2_text=emails["followup2_body"],
                )

                if success:
                    # Kontaktversuch protokollieren
                    kv = Kontaktversuch(
                        place_id=b.place_id,
                        typ="email",
                        email_adresse=b.email,
                        email_subject=emails["cold_subject"],
                        email_text=emails["cold_body"],
                        gesendet_am=datetime.now(timezone.utc),
                    )
                    db.add(kv)

                    b.outreach_status = "in_kampagne"
                    b.status = "kontaktiert"
                    b.letzter_kontakt_am = datetime.now(timezone.utc)
                    await db.commit()
                    verarbeitet += 1
                else:
                    fehler += 1

        except Exception as e:
            fehler += 1
            logger.error("Outreach fehlgeschlagen für %s: %s", betrieb.place_id, e)

        async with AsyncSessionLocal() as db:
            await _update_job(db, job_id, verarbeitet=verarbeitet, fehler=fehler)
            await _append_log(db, job_id, f"[{verarbeitet}/{total}] {betrieb.name} ({betrieb.email})")

    async with AsyncSessionLocal() as db:
        await _append_log(db, job_id, f"Outreach abgeschlossen: {verarbeitet} kontaktiert, {fehler} Fehler.")
        await _update_job(
            db, job_id,
            status="abgeschlossen",
            verarbeitet=verarbeitet,
            fehler=fehler,
            abgeschlossen_am=datetime.now(timezone.utc),
        )
