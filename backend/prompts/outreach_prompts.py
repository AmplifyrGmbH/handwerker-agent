"""
E-Mail-Templates für den Outreach.
Verfügbare Variablen: {firmenname}, {landing_url}, {inhaber_name}, {gewerk}, {berater_name}, {kontakt}
"""

COLD_SUBJECT = "{firmenname} — Ihr Arbeitstag 2026"

COLD_BODY = """\
Guten Tag {inhaber_name}

Angebote abends auf dem Küchentisch, Rechnungen die irgendwo warten — ich kenne den Alltag im {gewerk}.

Wir haben für {firmenname} eine kurze Seite gebaut, die zeigt, wie ein Arbeitstag 2026 aussehen könnte — von Auftrag bis Rechnung. Kein Produkt, nur eine Idee.

Schauen Sie kurz rein:
{landing_url}

Falls Sie danach 20 Minuten Zeit haben, reden wir gerne — unverbindlich, kein Verkauf.

{berater_name}
Amplifyr
{kontakt}\
"""

FOLLOWUP1_SUBJECT = "Nochmals: {firmenname} — Ihr Arbeitstag 2026"

FOLLOWUP1_BODY = """\
Guten Tag {inhaber_name}

Kurze Erinnerung an meine letzte Mail — ich weiß, es ist viel los im {gewerk}.

Die Seite zeigt in wenigen Minuten, wie ein Arbeitstag aussehen könnte:
{landing_url}

Hätten Sie danach Lust auf 20 Minuten Gespräch? Unverbindlich.

{berater_name}
Amplifyr\
"""

FOLLOWUP2_SUBJECT = "Letzte Nachricht: {firmenname}"

FOLLOWUP2_BODY = """\
Hallo {inhaber_name}

Letzte Nachricht von mir — versprochen.

Falls du noch einen Moment hast, schau kurz auf die Seite:
{landing_url}

Danach gerne ein kurzes Gespräch, 20 Minuten, ganz ohne Druck. Hast du Interesse?

{berater_name}
Amplifyr\
"""


def build_emails(
    firmenname: str,
    landing_url: str,
    inhaber_name: str = "",
    gewerk: str = "Handwerk",
    berater_name: str = "David Staub",
    kontakt: str = "info@amplifyr.ch",
) -> dict:
    ctx = {
        "firmenname": firmenname,
        "landing_url": landing_url,
        "inhaber_name": inhaber_name or "",
        "gewerk": gewerk,
        "berater_name": berater_name,
        "kontakt": kontakt,
    }
    return {
        "cold_subject": COLD_SUBJECT.format(**ctx),
        "cold_body": COLD_BODY.format(**ctx),
        "followup1_subject": FOLLOWUP1_SUBJECT.format(**ctx),
        "followup1_body": FOLLOWUP1_BODY.format(**ctx),
        "followup2_subject": FOLLOWUP2_SUBJECT.format(**ctx),
        "followup2_body": FOLLOWUP2_BODY.format(**ctx),
    }
