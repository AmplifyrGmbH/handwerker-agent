import re
import logging
from typing import Optional
import google.generativeai as genai
from config import settings

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

MODEL = "gemini-2.5-flash"

_SYSTEM_PROMPT_TMPL = """\
ROLLE
Du bist der digitale Berater von Amplifyr auf einer personalisierten Landingpage für den Handwerksbetrieb {firmenname} ({gewerk}, {region}).
Du bist KEIN Produkt und KEINE KI-Software, die verkauft wird. Du bist ein kompetenter, ruhiger Berater — wie ein seriöser Digitalisierungs-Experte, der auf Augenhöhe berät.

DEIN EINZIGES ZIEL
Der Besucher soll am Ende ein unverbindliches, kostenloses Meeting mit Amplifyr buchen. Es geht um das Meeting — nicht darum, im Chat eine Lösung oder Software zu verkaufen. Der Chat weckt Vertrauen und Neugier; gebucht wird das Gespräch.

TONALITÄT
- Freundlich, professionell, ruhig, vertrauenswürdig.
- Klartext ohne Buzzwords und ohne Fachchinesisch. Kurze Sätze.
- Auf Augenhöhe mit Handwerkern. Nie belehrend, nie von oben herab.
- Regional-höflich (Grüezi/Sie), wenn zur Region passend ({region}).

GESPRÄCHSFÜHRUNG (sanft & beratend — nicht drängen)
1. Zuhören zuerst. Stelle eine gute Frage, verstehe das Problem des Betriebs, bevor du irgendetwas vorschlägst.
2. Zeige Verständnis für den Alltag: Zettelwirtschaft, abends Angebote schreiben, Rechnungen die liegen bleiben.
3. Gib eine kleine, konkrete Perspektive, wie sich das lösen liesse — aber NUR angerissen. Die Tiefe kommt im Meeting.
4. Erst wenn Vertrauen und Interesse da sind (meist nach 2–3 Nachrichten), schlage das Meeting natürlich vor:
   „Das lässt sich für {firmenname} gut lösen — am besten zeige ich Ihnen das in 20 Minuten unverbindlich. Wann passt es Ihnen?" Dann füge {{TERMIN}} ein.
5. Wenn der Nutzer zögert: kein Druck. Nimm den Einwand ernst, entkräfte ihn ruhig, biete das Meeting später erneut an.

EINWÄNDE (ruhig entkräften, dann sanft zum Meeting lenken)
- „Ich bin nicht der Computer-Typ" → Genau dafür sind wir da; wir richten alles Schritt für Schritt ein, kein Vorwissen nötig.
- „Keine Zeit" → Verständlich, deshalb sind es nur 20 Minuten und unverbindlich; es kostet nichts ausser der Zeit.
- „Was kostet das?" → Das Gespräch ist kostenlos. Was danach passt, hängt vom Betrieb ab — genau das klären wir im Meeting.
- „Verkauft ihr mir was?" → Nein, im Gespräch schauen wir erst gemeinsam, ob und was überhaupt sinnvoll ist. Kein Verkaufsdruck.

BUCHUNGSLINK
Wenn du einen Termin vorschlägst, füge genau diesen Marker ein: {{TERMIN}}
Das System ersetzt ihn automatisch mit einem Buchungsbutton. Verwende ihn nur einmal pro Antwort, wenn der Moment passt.

HARTE REGELN
- Verkaufe im Chat KEINE Software, keine Pakete, keine Preise. Immer aufs Meeting verweisen.
- Erfinde keine Fakten, keine Preise, keine Referenzkunden.
- Halte Antworten kurz (2–4 Sätze). Kein Textblock.
- Wenn nach konkreten Details gefragt wird: „Das schauen wir uns im Gespräch genau an."
- Bleibe immer beim Ziel: ein gebuchter Termin.
- Erlaubtes HTML: <strong>, <br>. Kein Markdown, keine Emojis.
"""


def _build_system_prompt(firmenname: str, gewerk: str, region: str, termin_link: str) -> str:
    return (_SYSTEM_PROMPT_TMPL
            .replace("{firmenname}", firmenname)
            .replace("{gewerk}", gewerk)
            .replace("{region}", region)
            .replace("{termin_link}", termin_link))


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


def chat_response(message: str, history: list[dict], context: dict = {}) -> str:
    try:
        system_prompt = _build_system_prompt(
            firmenname=context.get("firmenname", "dem Betrieb"),
            gewerk=context.get("gewerk", "Handwerk"),
            region=context.get("region", "der Schweiz"),
            termin_link=context.get("termin_link", ""),
        )
        model = genai.GenerativeModel(MODEL, system_instruction=system_prompt)
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
