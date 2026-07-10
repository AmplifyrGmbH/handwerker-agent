import logging
import httpx
from config import settings

BASE_URL = "https://api.instantly.ai/api/v2"
logger = logging.getLogger(__name__)


def _headers() -> dict:
    return {"Authorization": f"Bearer {settings.INSTANTLY_KEY}", "Content-Type": "application/json"}


def get_campaign_id(branche: str = "") -> str:
    return settings.INSTANTLY_CAMPAIGN_ID


def add_contact(
    email: str,
    campaign_id: str,
    firmenname: str,
    landing_url: str,
    inhaber_name: str,
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

    name_parts = inhaber_name.split(" ", 1) if inhaber_name else []
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    payload = {
        "campaign_id": campaign_id,
        "leads": [
            {
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "company_name": firmenname,
                "website": landing_url,
                "personalization": email_text,
                "custom_variables": {
                    "subject": subject,
                    "followup1_subject": followup1_subject,
                    "followup1_text": followup1_text,
                    "followup2_subject": followup2_subject,
                    "followup2_text": followup2_text,
                },
            }
        ],
        "skip_if_in_workspace": True,
    }
    try:
        resp = httpx.post(f"{BASE_URL}/leads/add", json=payload, headers=_headers(), timeout=15)
        resp.raise_for_status()
        return True
    except Exception as e:
        logger.error("Instantly add_contact failed for %s: %s", email, e)
        return False
