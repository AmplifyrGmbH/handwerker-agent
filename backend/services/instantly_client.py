import logging
import httpx
from config import settings

BASE_URL = "https://api.instantly.ai/api/v2"
logger = logging.getLogger(__name__)


def _headers() -> dict:
    return {"Authorization": f"Bearer {settings.INSTANTLY_KEY}", "Content-Type": "application/json"}


def get_campaign_id(branche: str) -> str:
    mapping = {
        "Maler": settings.INSTANTLY_CAMPAIGN_ID_MALER,
        "Elektriker": settings.INSTANTLY_CAMPAIGN_ID_ELEKTRIKER,
        "Schreiner": settings.INSTANTLY_CAMPAIGN_ID_SCHREINER,
        "Sanitär": settings.INSTANTLY_CAMPAIGN_ID_SANITAER,
        "Dachdecker": settings.INSTANTLY_CAMPAIGN_ID_DACHDECKER,
    }
    return mapping.get(branche, "")


def add_contact(
    email: str,
    campaign_id: str,
    firmenname: str,
    landing_url: str,
    subject: str,
    email_text: str,
    followup1_subject: str,
    followup1_text: str,
    followup2_subject: str,
    followup2_text: str,
) -> bool:
    if settings.INSTANTLY_DRY_RUN:
        logger.info(
            "[DRY RUN] Would add contact %s to campaign %s for %s",
            email, campaign_id, firmenname,
        )
        return True

    payload = {
        "email": email,
        "campaign_id": campaign_id,
        "variables": {
            "firmenname": firmenname,
            "landing_url": landing_url,
        },
        "sequences": [
            {"subject": subject, "body": email_text},
            {"subject": followup1_subject, "body": followup1_text},
            {"subject": followup2_subject, "body": followup2_text},
        ],
    }
    try:
        resp = httpx.post(f"{BASE_URL}/leads", json=payload, headers=_headers(), timeout=15)
        resp.raise_for_status()
        return True
    except Exception as e:
        logger.error("Instantly add_contact failed for %s: %s", email, e)
        return False
