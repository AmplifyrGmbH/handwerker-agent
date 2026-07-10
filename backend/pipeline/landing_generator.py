import logging
import re
from datetime import datetime, timezone
from typing import Optional

from jinja2 import Environment, FileSystemLoader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import AsyncSessionLocal
from models import Betrieb, Job
from services import gemini_client, r2_client

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


def _slugify(text: str) -> str:
    replacements = {"ä": "ae", "ö": "oe", "ü": "ue", "Ä": "ae", "Ö": "oe", "Ü": "ue", "ß": "ss"}
    for k, v in replacements.items():
        text = text.replace(k, v)
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    return text


async def _unique_slug(db: AsyncSession, base_slug: str, current_place_id: str) -> str:
    slug = base_slug
    counter = 1
    while True:
        result = await db.execute(
            select(Betrieb.place_id).where(
                Betrieb.slug == slug,
                Betrieb.place_id != current_place_id,
            )
        )
        if not result.scalar():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


def _render_template(context: dict) -> str:
    import os
    template_dir = os.path.join(os.path.dirname(__file__), "..", "templates")
    env = Environment(loader=FileSystemLoader(template_dir), autoescape=True)
    template_name = f"landing_{settings.LANDING_TEMPLATE}.html"
    template = env.get_template(template_name)
    return template.render(**context)


async def run(job_id: int, place_id: Optional[str] = None):
    async with AsyncSessionLocal() as db:
        await _append_log(db, job_id, "Landing-Page-Generierung gestartet...")

        if place_id:
            betriebe = [await db.get(Betrieb, place_id)]
            betriebe = [b for b in betriebe if b]
        else:
            result = await db.execute(
                select(Betrieb).where(Betrieb.status == "extrahiert")
            )
            betriebe = list(result.scalars().all())

        total = len(betriebe)
        await _update_job(db, job_id, total=total)
        await _append_log(db, job_id, f"{total} Landing Pages werden generiert...")

    verarbeitet = 0
    fehler = 0

    for betrieb in betriebe:
        try:
            async with AsyncSessionLocal() as db:
                b = await db.get(Betrieb, betrieb.place_id)
                if not b:
                    continue

                # Slug generieren
                firmenname = b.name_anzeige or b.name
                ort = b.ort or ""
                base_slug = _slugify(f"{firmenname}-{ort}")
                slug = await _unique_slug(db, base_slug, b.place_id)

                # Einleitung generieren
                einleitung = ""
                if b.firmenprofil:
                    einleitung = gemini_client.generate_einleitung(
                        b.firmenprofil,
                        firmenname,
                        ort,
                        b.branche or "Handwerk",
                    )
                if not einleitung:
                    einleitung = f"Wir haben etwas Besonderes für {firmenname} aus {ort} gebaut."

                # HTML rendern
                html = _render_template({
                    "firmenname": firmenname,
                    "einleitung": einleitung,
                    "farbe_primary": b.farbe_primary or "#1a56db",
                    "logo_url": b.logo_url or "",
                    "slug": slug,
                    "chat_api_url": settings.CHAT_API_URL,
                })

                # Nach R2 hochladen
                key = f"handwerker/{slug}/index.html"
                r2_client.upload_html(html, key)

                landing_url = f"https://{settings.LANDING_DOMAIN}/{slug}"

                b.slug = slug
                b.landing_url = landing_url
                b.status = "landing_generiert"
                b.landing_generiert_am = datetime.now(timezone.utc)
                await db.commit()

            verarbeitet += 1
        except Exception as e:
            fehler += 1
            logger.error("Landing-Generierung fehlgeschlagen für %s: %s", betrieb.place_id, e)
            async with AsyncSessionLocal() as db:
                b = await db.get(Betrieb, betrieb.place_id)
                if b:
                    b.status = "fehler"
                    b.fehler_log = str(e)
                    await db.commit()

        async with AsyncSessionLocal() as db:
            await _update_job(db, job_id, verarbeitet=verarbeitet, fehler=fehler)
            await _append_log(db, job_id, f"[{verarbeitet}/{total}] {betrieb.name}")

    async with AsyncSessionLocal() as db:
        await _append_log(db, job_id, f"Landing Pages abgeschlossen: {verarbeitet} OK, {fehler} Fehler.")
        await _update_job(
            db, job_id,
            status="abgeschlossen",
            verarbeitet=verarbeitet,
            fehler=fehler,
            abgeschlossen_am=datetime.now(timezone.utc),
        )
