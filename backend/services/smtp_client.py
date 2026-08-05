import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config import settings

logger = logging.getLogger(__name__)


def send_demo_email(
    to_email: str,
    firmenname: str,
    landing_url: str,
    inhaber_name: str = "",
    berater_name: str = "",
) -> bool:
    """Sendet die Demo-E-Mail mit dem Landing-Page-Link an den Betrieb."""
    if not settings.SMTP_USER or not settings.SMTP_PASS:
        logger.error("SMTP nicht konfiguriert (SMTP_USER/SMTP_PASS fehlen)")
        return False

    anrede = f"Guten Tag{' ' + inhaber_name if inhaber_name else ''}"
    subject = f"Ihre persönliche KI-Demo – {firmenname}"
    body_html = f"""
<html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
<p>{anrede}</p>
<p>Ich habe für <strong>{firmenname}</strong> eine persönliche KI-Demo vorbereitet,
die zeigt, wie ein KI-Assistent Ihre Kundenkommunikation automatisieren kann.</p>
<p style="margin: 24px 0;">
  <a href="{landing_url}"
     style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
    Demo ansehen →
  </a>
</p>
<p>Der Assistent ist bereits auf Ihr Unternehmen angepasst und kann direkt ausprobiert werden.</p>
<p>Gerne beantworte ich Ihre Fragen in einem kurzen Gespräch.</p>
<p>Freundliche Grüsse<br>{berater_name or settings.AMPLIFYR_NAME}<br>{settings.AMPLIFYR_FIRMA}</p>
</body></html>
"""
    body_text = (
        f"{anrede}\n\n"
        f"Ich habe für {firmenname} eine persönliche KI-Demo vorbereitet:\n"
        f"{landing_url}\n\n"
        f"Freundliche Grüsse\n{berater_name or settings.AMPLIFYR_NAME}"
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(body_text, "plain", "utf-8"))
    msg.attach(MIMEText(body_html, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(msg["From"], [to_email], msg.as_string())
        logger.info("Demo-E-Mail gesendet an %s", to_email)
        return True
    except Exception as e:
        logger.error("SMTP-Fehler beim Senden an %s: %s", to_email, e)
        return False
