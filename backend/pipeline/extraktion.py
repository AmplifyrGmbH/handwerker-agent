import asyncio
import logging
import re
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal
from models import Betrieb, Job
from services import gemini_client, r2_client, screenshot_client

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

UNTERSEITEN_KEYWORDS_URL = ["ueber", "uber", "about", "team", "impressum", "kontakt", "contact", "firma", "wir"]
UNTERSEITEN_KEYWORDS_TEXT = ["über uns", "uber uns", "about us", "team", "impressum", "kontakt", "unternehmen"]

CSS_COLOR_RE = re.compile(
    r"(?:background-color|background)\s*:\s*(#[0-9a-fA-F]{3,6})",
    re.IGNORECASE,
)
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
LOGO_ATTRS = re.compile(r"logo", re.IGNORECASE)


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


def _is_bland_color(hex_color: str) -> bool:
    """Returns True if color is white/black/light-gray (should be ignored)."""
    c = hex_color.lstrip("#")
    if len(c) == 3:
        c = "".join(ch * 2 for ch in c)
    if len(c) != 6:
        return True
    r, g, b = int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)
    # White or near-white
    if r > 220 and g > 220 and b > 220:
        return True
    # Black or near-black
    if r < 30 and g < 30 and b < 30:
        return True
    return False


def _extract_color_from_css(html: str) -> Optional[str]:
    colors = CSS_COLOR_RE.findall(html)
    for c in colors:
        if not _is_bland_color(c):
            return c
    return None


def _find_logo_url(soup: BeautifulSoup, base_url: str) -> Optional[tuple[str, str]]:
    """Returns (absolute_url, mime_type) or None."""
    for img in soup.find_all("img"):
        src = img.get("src", "")
        alt = img.get("alt", "")
        cls = " ".join(img.get("class", []))
        img_id = img.get("id", "")
        if LOGO_ATTRS.search(src + alt + cls + img_id):
            abs_url = urljoin(base_url, src)
            ext = src.rsplit(".", 1)[-1].lower().split("?")[0]
            mime = {
                "png": "image/png",
                "jpg": "image/jpeg",
                "jpeg": "image/jpeg",
                "svg": "image/svg+xml",
                "webp": "image/webp",
                "gif": "image/gif",
            }.get(ext, "image/png")
            return abs_url, mime
    return None


def _find_unterseiten(soup: BeautifulSoup, base_url: str) -> list[str]:
    parsed_base = urlparse(base_url)
    found = []
    for a in soup.find_all("a", href=True):
        href = a["href"].lower()
        text = a.get_text().lower()
        match = any(k in href for k in UNTERSEITEN_KEYWORDS_URL) or \
                any(k in text for k in UNTERSEITEN_KEYWORDS_TEXT)
        if match:
            abs_url = urljoin(base_url, a["href"])
            parsed = urlparse(abs_url)
            if parsed.netloc == parsed_base.netloc and abs_url not in found:
                found.append(abs_url)
        if len(found) >= 5:
            break
    return found


def _clean_text(soup: BeautifulSoup) -> str:
    for tag in soup(["script", "style", "svg", "noscript", "nav", "header", "footer"]):
        tag.decompose()
    return " ".join(soup.get_text(separator=" ").split())


def _extract_email(html: str) -> Optional[str]:
    # Check mailto links first
    mailto = re.search(r'mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})', html)
    if mailto:
        return mailto.group(1)
    # Fallback: plaintext regex
    matches = EMAIL_RE.findall(html)
    for m in matches:
        if not m.endswith((".png", ".jpg", ".jpeg", ".gif", ".svg")):
            return m
    return None


async def _process_betrieb(betrieb: Betrieb, job_id: int):
    async with AsyncSessionLocal() as db:
        try:
            await _process_betrieb_inner(db, betrieb, job_id)
        except Exception as e:
            logger.exception("Unhandled error for %s: %s", betrieb.place_id, e)
            b = await db.get(Betrieb, betrieb.place_id)
            if b:
                b.status = "fehler"
                b.fehler_log = str(e)
                await db.commit()


async def _process_betrieb_inner(db: AsyncSession, betrieb: Betrieb, job_id: int):
    place_id = betrieb.place_id
    url = betrieb.website_url

    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=15) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            html_main = resp.text
            base_url = str(resp.url)
        except Exception as e:
            b = await db.get(Betrieb, place_id)
            if b:
                b.status = "fehler"
                b.fehler_log = f"Website nicht erreichbar: {e}"
                await db.commit()
            return

        soup_main = BeautifulSoup(html_main, "html.parser")

        # Unterseiten laden
        unterseiten_urls = _find_unterseiten(soup_main, base_url)
        all_html = html_main
        all_text = _clean_text(BeautifulSoup(html_main, "html.parser"))

        for u_url in unterseiten_urls:
            try:
                u_resp = await client.get(u_url)
                u_soup = BeautifulSoup(u_resp.text, "html.parser")
                all_text += " " + _clean_text(u_soup)
                all_html += u_resp.text
            except Exception:
                pass

        # Logo finden
        logo_result = _find_logo_url(soup_main, base_url)
        logo_url_r2 = None
        hat_logo = False
        farbe_primary = None

        if logo_result:
            logo_abs_url, logo_mime = logo_result
            try:
                logo_resp = await client.get(logo_abs_url)
                logo_bytes = logo_resp.content
                ext = logo_abs_url.rsplit(".", 1)[-1].lower().split("?")[0]
                if ext not in ("png", "jpg", "jpeg", "svg", "webp", "gif"):
                    ext = "png"
                key = f"handwerker/{place_id}/logo.{ext}"
                logo_url_r2 = r2_client.upload_bytes(logo_bytes, key, logo_mime)
                hat_logo = True

                # Farbe aus Logo
                info = gemini_client.extract_logo_info(logo_bytes, logo_mime)
                farbe_primary = info.get("color")
            except Exception as e:
                logger.warning("Logo-Fehler für %s: %s", place_id, e)

        # Primärfarbe — Fallback CSS
        if not farbe_primary:
            farbe_primary = _extract_color_from_css(all_html)

        # Primärfarbe — Fallback Screenshot
        if not farbe_primary:
            try:
                screenshot_bytes = await screenshot_client.take_screenshot(base_url)
                key = f"handwerker/{place_id}/screenshot.jpg"
                r2_client.upload_bytes(screenshot_bytes, key, "image/jpeg")
                farbe_primary = gemini_client.extract_primary_color(screenshot_bytes)
            except Exception as e:
                logger.warning("Screenshot-Fehler für %s: %s", place_id, e)

        # E-Mail
        email = _extract_email(all_html)

        # Inhaber
        inhaber_name = gemini_client.extract_inhaber(all_text)

        # Firmenprofil
        firmenprofil = gemini_client.generate_firmenprofil(all_text, betrieb.branche or "Handwerk")

    # DB speichern
    async with AsyncSessionLocal() as db2:
        b = await db2.get(Betrieb, place_id)
        if b:
            b.email = email
            b.hat_logo = hat_logo
            b.logo_url = logo_url_r2
            b.farbe_primary = farbe_primary
            b.inhaber_name = inhaber_name
            b.firmenprofil = firmenprofil
            b.status = "extrahiert"
            b.extrahiert_am = datetime.now(timezone.utc)
            await db2.commit()


async def run(job_id: int, place_id: Optional[str] = None, final_step: bool = True):
    async with AsyncSessionLocal() as db:
        await _append_log(db, job_id, "Extraktion gestartet...")

        if place_id:
            betriebe = [await db.get(Betrieb, place_id)]
            betriebe = [b for b in betriebe if b]
        else:
            result = await db.execute(
                select(Betrieb).where(
                    Betrieb.status == "entdeckt",
                    Betrieb.keine_website == False,  # noqa: E712
                )
            )
            betriebe = list(result.scalars().all())

        total = len(betriebe)
        await _update_job(db, job_id, total=total)
        await _append_log(db, job_id, f"{total} Betriebe werden extrahiert...")

    verarbeitet = 0
    fehler = 0

    for betrieb in betriebe:
        try:
            await _process_betrieb(betrieb, job_id)
            verarbeitet += 1
        except Exception as e:
            fehler += 1
            logger.error("Extraktion fehlgeschlagen für %s: %s", betrieb.place_id, e)

        async with AsyncSessionLocal() as db:
            await _update_job(db, job_id, verarbeitet=verarbeitet, fehler=fehler)
            await _append_log(db, job_id, f"[{verarbeitet}/{total}] {betrieb.name}")

        await asyncio.sleep(0.5)  # Rate limiting

    async with AsyncSessionLocal() as db:
        await _append_log(db, job_id, f"Extraktion abgeschlossen: {verarbeitet} OK, {fehler} Fehler.")
        await _update_job(
            db, job_id,
            **({"status": "abgeschlossen", "abgeschlossen_am": datetime.now(timezone.utc)} if final_step else {}),
            verarbeitet=verarbeitet,
            fehler=fehler,
        )
