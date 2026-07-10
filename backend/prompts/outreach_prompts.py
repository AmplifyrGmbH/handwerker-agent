"""
E-Mail-Templates für den Outreach.
Platzhalter-Texte — werden vor Go-Live mit finalen Inhalten ersetzt.
Verfügbare Variablen: {firmenname}, {landing_url}
"""

COLD_SUBJECT = "Für {firmenname} gebaut: Ihr digitaler Assistent für neue Aufträge"

COLD_BODY = """\
Guten Tag

Wir haben etwas für {firmenname} gebaut — einen digitalen Assistenten, der Ihre Kundenanfragen rund um die Uhr beantwortet.

Handwerksbetriebe verlieren täglich Aufträge, weil Anfragen zu spät oder gar nicht beantwortet werden. Unser Assistent fängt das auf: Er antwortet sofort, qualifiziert die Anfrage und leitet sie direkt an Sie weiter.

Schauen Sie es sich an: {landing_url}

Gerne zeigen wir Ihnen in einem kurzen Gespräch, wie das konkret für {firmenname} aussehen würde.

Freundliche Grüsse
Das Amplifyr-Team
"""

FOLLOWUP1_SUBJECT = "Re: Für {firmenname} gebaut: Ihr digitaler Assistent für neue Aufträge"

FOLLOWUP1_BODY = """\
Guten Tag

Kurze Nachfrage zu meiner letzten Mail: Haben Sie die Landing Page für {firmenname} angeschaut? {landing_url}

Ich würde gerne kurz mit Ihnen darüber sprechen — 15 Minuten reichen.

Freundliche Grüsse
Das Amplifyr-Team
"""

FOLLOWUP2_SUBJECT = "Re: Für {firmenname} gebaut: Ihr digitaler Assistent für neue Aufträge"

FOLLOWUP2_BODY = """\
Guten Tag

Das ist meine letzte Mail zu diesem Thema.

Falls Sie irgendwann Interesse an einem digitalen Assistenten für {firmenname} haben — wir sind unter info@amplifyr.ch erreichbar.

Freundliche Grüsse
Das Amplifyr-Team
"""


def build_emails(firmenname: str, landing_url: str) -> dict:
    ctx = {"firmenname": firmenname, "landing_url": landing_url}
    return {
        "cold_subject": COLD_SUBJECT.format(**ctx),
        "cold_body": COLD_BODY.format(**ctx),
        "followup1_subject": FOLLOWUP1_SUBJECT.format(**ctx),
        "followup1_body": FOLLOWUP1_BODY.format(**ctx),
        "followup2_subject": FOLLOWUP2_SUBJECT.format(**ctx),
        "followup2_body": FOLLOWUP2_BODY.format(**ctx),
    }
