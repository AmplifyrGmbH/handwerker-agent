import re
import logging
from typing import Optional
import google.generativeai as genai
from config import settings

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

MODEL = "gemini-2.5-flash"

CHATBOT_SYSTEM_PROMPT = """Du bist der digitale Berater von Amplifyr — einer Schweizer Firma die Handwerksbetrieben KI-Assistenten baut.

Deine Aufgabe: Fragen des Handwerkers beantworten und ein Gespräch mit dem Amplifyr-Team vereinbaren.

ANGEBOT:
- KI-Assistent der Kundenanfragen 24/7 beantwortet (Website + optional WhatsApp)
- Einrichtung in 2 Wochen, keine technischen Kenntnisse nötig
- Kosten: ab CHF 290 — monatlich, kündbar
- Inklusive: Setup, Anpassungen, Support

GESPRÄCHSZIEL:
Jedes Gespräch soll in einem Termin mit dem Amplifyr-Team enden.
Kalender-Link: https://cal.com/amplifyr/erstgespraech

REGELN:
- Deutsch, Sie-Form
- Kein Markdown, kein Emoji
- Erlaubtes HTML: <strong>, <br>, <a href="...">
- Kurz und direkt
- Bei Preisfragen: Richtwert nennen, für genaues Angebot Termin empfehlen
- Nie versprechen was nicht im Angebot steht
"""


def _hex_or_none(text: str) -> Optional[str]:
    text = text.strip()
    m = re.search(r"#[0-9a-fA-F]{3,6}", text)
    if m:
        return m.group(0)
    return None


def extract_primary_color(screenshot_bytes: bytes) -> Optional[str]:
    try:
        model = genai.GenerativeModel(MODEL)
        image_part = {"mime_type": "image/jpeg", "data": screenshot_bytes}
        prompt = (
            "Identifiziere die dominante Brandfarbe dieser Website "
            "(Navbar, CTA-Buttons, Akzente). "
            "Ignoriere Weiss, Hellgrau (#f0f0f0 und heller), Schwarz. "
            "Antworte nur mit dem Hex-Code (z.B. #2e7d32) oder 'none'."
        )
        response = model.generate_content([prompt, image_part])
        return _hex_or_none(response.text)
    except Exception as e:
        logger.error("extract_primary_color failed: %s", e)
        return None


def extract_logo_info(logo_bytes: bytes, mime_type: str) -> dict:
    try:
        model = genai.GenerativeModel(MODEL)
        image_part = {"mime_type": mime_type, "data": logo_bytes}
        prompt = (
            "Analysiere dieses Logo. Nenne die dominante Brandfarbe als Hex-Code. "
            "Ignoriere Weiss, Hellgrau, Schwarz. "
            "Antworte nur mit dem Hex-Code (z.B. #2e7d32) oder 'none'."
        )
        response = model.generate_content([prompt, image_part])
        color = _hex_or_none(response.text)
        return {"color": color}
    except Exception as e:
        logger.error("extract_logo_info failed: %s", e)
        return {"color": None}


def extract_inhaber(text: str) -> Optional[str]:
    try:
        model = genai.GenerativeModel(MODEL)
        prompt = (
            "Finde den Namen des Inhabers oder Geschäftsführers in diesem Text. "
            "Antworte nur mit dem Namen (keine Titel wie Herr/Frau/Dr.). "
            "Antworte mit 'null' wenn nicht eindeutig erkennbar.\n\n"
            f"Text:\n{text[:8000]}"
        )
        response = model.generate_content(prompt)
        result = response.text.strip()
        if result.lower() in ("null", "none", ""):
            return None
        return result
    except Exception as e:
        logger.error("extract_inhaber failed: %s", e)
        return None


def generate_firmenprofil(text: str, branche: str) -> str:
    try:
        model = genai.GenerativeModel(MODEL)
        prompt = (
            f"Schreibe ein kurzes Firmenprofil für diesen {branche}-Betrieb aus der Schweiz. "
            "Nutze alle verfügbaren Informationen (Gründungsjahr, Grösse, Spezialgebiet, "
            "Inhaber, Standort, Besonderheiten). "
            "Schreibe so ausführlich wie der Informationsgehalt es erlaubt — "
            "von 2 Sätzen bis zu einem Absatz. "
            "Keine erfundenen Informationen. Nur das Profil, kein Titel.\n\n"
            f"Website-Text:\n{text[:10000]}"
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error("generate_firmenprofil failed: %s", e)
        return ""


def generate_einleitung(firmenprofil: str, firmenname: str, ort: str, branche: str) -> str:
    try:
        model = genai.GenerativeModel(MODEL)
        prompt = (
            f"Schreibe 2–4 Sätze als persönliche Ansprache für {firmenname} aus {ort} ({branche}). "
            "Gehe spezifisch auf die Firma ein. "
            "Spreche die Firma direkt an (Sie-Form). Kein Marketing-Sprech. "
            "Nur die Sätze, kein Titel.\n\n"
            f"Firmenprofil:\n{firmenprofil}"
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error("generate_einleitung failed: %s", e)
        return f"Wir haben etwas Besonderes für {firmenname} aus {ort} gebaut."


def chat_response(message: str, history: list[dict]) -> str:
    try:
        model = genai.GenerativeModel(MODEL, system_instruction=CHATBOT_SYSTEM_PROMPT)
        gemini_history = []
        for h in history:
            role = "user" if h.get("role") == "user" else "model"
            gemini_history.append({"role": role, "parts": [h.get("content", "")]})
        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(message)
        return response.text.strip()
    except Exception as e:
        logger.error("chat_response failed: %s", e)
        return "Es tut mir leid, ich konnte Ihre Anfrage nicht verarbeiten. Bitte versuchen Sie es erneut."
