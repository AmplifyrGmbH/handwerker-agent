import logging
from datetime import datetime, timezone
from typing import Optional

import tldextract
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal
from models import Betrieb, Job
from services import apify_client

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


def _extract_domain(url: str) -> Optional[str]:
    if not url:
        return None
    ext = tldextract.extract(url)
    if ext.domain and ext.suffix:
        return f"{ext.domain}.{ext.suffix}"
    return None


async def run(job_id: int, branche: str, kanton: str, max_per_search: int):
    async with AsyncSessionLocal() as db:
        await _append_log(db, job_id, f"Discovery gestartet: {branche}, Kanton={kanton or 'alle'}, max={max_per_search}")

        queries = apify_client.get_search_queries(branche, kanton)
        await _append_log(db, job_id, f"{len(queries)} Suchanfragen werden ausgeführt...")

        try:
            items = await apify_client.run_scraper(queries, max_per_search)
        except Exception as e:
            await _append_log(db, job_id, f"Apify-Fehler: {e}")
            await _update_job(db, job_id, status="fehler", abgeschlossen_am=datetime.now(timezone.utc))
            return

        await _append_log(db, job_id, f"Apify zurückgegeben: {len(items)} Einträge. Verarbeite...")
        await _update_job(db, job_id, total=len(items))

        # In-memory domain set für Duplikatschutz innerhalb dieses Laufs
        seen_domains: set[str] = set()

        # Bestehende Domains aus DB laden
        existing = await db.execute(
            select(Betrieb.website_domain).where(Betrieb.website_domain.isnot(None))
        )
        for (domain,) in existing:
            if domain:
                seen_domains.add(domain)

        inserted = 0
        skipped = 0

        for item in items:
            if item.get("permanentlyClosed"):
                skipped += 1
                continue
            if item.get("countryCode", "").upper() not in ("CH", ""):
                skipped += 1
                continue

            place_id = item.get("placeId") or item.get("id")
            if not place_id:
                skipped += 1
                continue

            website_url = item.get("website") or None
            website_domain = _extract_domain(website_url) if website_url else None
            keine_website = website_url is None

            if website_domain:
                if website_domain in seen_domains:
                    skipped += 1
                    continue
                seen_domains.add(website_domain)

            reviews_raw = None
            if item.get("reviews"):
                reviews_raw = [
                    {
                        "autor": r.get("name"),
                        "sterne": r.get("stars"),
                        "text": r.get("text"),
                        "datum": r.get("publishAt"),
                    }
                    for r in item["reviews"][:5]
                ]

            koordinaten = None
            if item.get("location"):
                koordinaten = {
                    "lat": item["location"].get("lat"),
                    "lng": item["location"].get("lng"),
                }

            stmt = (
                insert(Betrieb)
                .values(
                    place_id=place_id,
                    name=item.get("title", "Unbekannt"),
                    adresse=item.get("address"),
                    plz=item.get("postalCode"),
                    ort=item.get("city"),
                    kanton=item.get("state"),
                    telefon=item.get("phone"),
                    website_url=website_url,
                    website_domain=website_domain,
                    keine_website=keine_website,
                    google_rating=item.get("totalScore"),
                    google_anzahl=item.get("reviewsCount"),
                    oeffnungszeiten=item.get("openingHours"),
                    koordinaten=koordinaten,
                    google_reviews_raw=reviews_raw,
                    status="kein_website" if keine_website else "entdeckt",
                    branche=branche,
                    name_anzeige=item.get("title"),
                )
                .on_conflict_do_nothing(index_elements=["place_id"])
            )
            await db.execute(stmt)
            inserted += 1

        await db.commit()
        await _append_log(
            db, job_id,
            f"Fertig: {inserted} neu gespeichert, {skipped} übersprungen."
        )
        await _update_job(
            db, job_id,
            status="abgeschlossen",
            verarbeitet=inserted,
            fehler=skipped,
            abgeschlossen_am=datetime.now(timezone.utc),
        )
