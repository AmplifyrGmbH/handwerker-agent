# Handwerker Agent — Vollständige Spezifikation

Stand: Juli 2026

---

## TEIL 1: FUNKTIONEN

### Was das System macht

Das System identifiziert automatisch Schweizer Handwerksbetriebe, extrahiert ihre Firmendaten,
generiert eine personalisierte Landing Page mit Live-Chatbot und kontaktiert die Betriebe per
Cold-Mail. Ziel jedes Kontakts ist ein Gespräch über digitale Transformation — kein direkter
Verkaufsabschluss, sondern ein Termin mit Amplifyr.

---

### Funktion 1: Leads finden

Der Nutzer startet einen Suchlauf über das Dashboard. Vor dem Start wählt er:
- Branche (z.B. "Maler", "Elektriker", "Schreiner", "Sanitär", "Dachdecker")
- Kanton (z.B. "Zürich", "Bern" — oder leer für alle Deutschschweizer Kantone)
- Maximale Anzahl Ergebnisse pro Suchanfrage

Das System baut Suchanfragen nach dem Muster "{Branche} {Kanton} Schweiz" und führt sie gegen
Google Maps aus. Für jeden gefundenen Betrieb speichert das System:
- place_id (Google Maps ID, Primärschlüssel)
- Firmenname
- Adresse, PLZ, Ort, Kanton
- Telefonnummer
- Website-URL (falls vorhanden)
- Google-Bewertung und Anzahl Bewertungen
- Öffnungszeiten
- Koordinaten (lat/lng)
- Top-5 Google-Bewertungen (Autor, Sterne, Text, Datum)

Betriebe ohne Website erhalten den Status "kein_website" und werden gespeichert, aber nicht
weiterverarbeitet. Betriebe mit Website erhalten den Status "entdeckt" und warten auf den
nächsten Schritt. Duplikate werden per place_id (Google Maps ID) und Website-Domain
verhindert — gleiche Domain aus zwei Läufen wird nur einmal gespeichert.

---

### Funktion 2: Firmendaten extrahieren

Das System lädt die Website jedes Betriebs mit Status "entdeckt" und extrahiert:

**Strukturiert (immer gespeichert):**
- Firmenname (bereinigt, aus Logo, Website-Titel oder Google Maps)
- E-Mail-Adresse (gescraped aus der Website)
- Logo (Bilddatei, hochgeladen in Cloud-Speicher)
- Primärfarbe der Website (aus CSS oder Screenshot per KI)
- Name des Inhabers / Chefs (aus Über-uns, Impressum, Teamseite)

**Firmenprofil (Freitext, KI-generiert):**
Das System scraped den gesamten sichtbaren Text der Website (Startseite + Unterseiten wie
Über uns, Impressum, Team). Der Text wird bereinigt (keine Scripts, Styles, Navigationselemente)
und einer KI übergeben. Die KI schreibt daraus ein kurzes Firmenprofil — so lang wie der
Informationsgehalt der Seite es hergibt. Das Profil soll einem Leser ein konkretes Gespür für
den Betrieb vermitteln: Wer sind die Leute, was machen sie genau, wie lange gibt es sie, wie
gross sind sie, was macht sie besonders.

Das Firmenprofil fliessen ein in die Landing Page Einleitung.

Nach der Extraktion erhält der Betrieb den Status "extrahiert".

Betriebe ohne E-Mail-Adresse werden trotzdem weiterverarbeitet (Status "extrahiert"), aber
beim Outreach übersprungen.

---

### Funktion 3: Landing Page generieren

Pro Betrieb wird automatisch eine personalisierte Landing Page als HTML-Datei erstellt.

**Immer personalisiert:**
- Firmenname im Titel und in Überschriften
- Logo eingebettet (aus Cloud-Speicher)
- Primärfarbe in Buttons, Akzenten, Header-Hintergrund

**Individuell aus Firmenprofil:**
- Einleitung: 2–4 Sätze die spezifisch auf diesen Betrieb eingehen (Chef-Name, Gründungsjahr,
  Spezialgebiet, Ort). Generiert per KI aus dem Firmenprofil.

**Chatbot auf der Seite:**
Der Chatbot ist kein Demo des Handwerker-Assistenten — er ist ein Amplifyr-Verkäufer.
Er beantwortet Fragen eines Handwerkers zum Amplifyr-Angebot:
- Was kostet das?
- Wie funktioniert das technisch?
- Was bringt mir das konkret?
- Wie lange dauert die Einrichtung?
- Brauche ich eine neue Website?
Der Bot kennt Amplifyr's Angebot, Preise und Ablauf und führt das Gespräch aktiv
in Richtung Terminvereinbarung (Kalender-Link oder direkter Rückruf).

**Inhalt der Landing Page:**

```
[HEADER]
Logo + Firmenname in Primärfarbe

[HERO]
Personalisierte Einleitung (KI-generiert aus Firmenprofil)
Hauptaussage: "Wir haben etwas für {firmenname} gebaut"
→ Button: "Jetzt anfragen" (scrollt zum Chatbot)

[PROBLEM]
3 kurze Punkte — was Handwerker täglich verlieren:
- Anrufe die während der Arbeit nicht entgegengenommen werden
- Anfragen die zu spät beantwortet werden und zum Mitbewerber gehen
- Abende am Telefon statt mit der Familie

[LÖSUNG]
Was der KI-Assistent konkret macht:
- Beantwortet Anfragen rund um die Uhr
- Qualifiziert: was will der Kunde, wann, wo
- Leitet weiter oder bucht direkt einen Termin

[CHATBOT]
Überschrift: "Haben Sie Fragen? Unser Assistent antwortet sofort."
Subtext: "Was kostet das? Wie funktioniert das? Passt das zu uns? — fragen Sie einfach."
Live-Chat Widget (Amplifyr-Verkäufer-Bot, kein Produktdemo)

[CTA]
"Termin vereinbaren" → Kalender-Link
Oder: "Rückruf anfragen" → kurzes Formular (Name, Telefon)

[FOOTER]
Powered by Amplifyr + Link zu amplifyr.ch
```

Die fertige HTML-Datei wird in den Cloud-Speicher hochgeladen. Die Landing Page ist über
eine eigene Domain erreichbar: `{domain}/{slug}` — wobei `slug` aus dem Firmennamen
generiert wird (z.B. "maler-hess-ag-zuerich").

Nach der Generierung erhält der Betrieb den Status "landing_generiert" und eine `landing_url`.

---

### Funktion 4: Outreach

Das System verschickt automatisch eine Sequenz von drei E-Mails an alle Betriebe mit Status
"landing_generiert" und einer E-Mail-Adresse.

- Cold Mail: "Für {Firmenname} gebaut: [Beschreibung]" + Landing Page URL
- Follow-up 1: Kurzfassung, direkter Hinweis auf Landing Page
- Follow-up 2: Abschlussmail, kein weiterer Kontakt angekündigt

Ton und Stil: Hochdeutsch, professionell, direkt — kein Marketing-Sprech.
**Mail-Texte (Platzhalter — werden vor Go-Live ausgearbeitet):**

Cold Mail:
- Betreff: `Für {firmenname} gebaut: Ihr digitaler Assistent für neue Aufträge`
- Kern: Wir haben etwas für Sie gebaut. Handwerker verlieren täglich Aufträge weil
  Anfragen unbeantwortet bleiben — der Assistent fängt das auf. Schauen Sie es sich an:
  {landing_url}

Follow-up 1:
- Betreff: `Re: Für {firmenname} gebaut: Ihr digitaler Assistent für neue Aufträge`
- Kern: Kurze Erinnerung, direkter Link, eine konkrete Frage stellen.

Follow-up 2 (Abschlussmail):
- Betreff: `Re: Für {firmenname} gebaut: Ihr digitaler Assistent für neue Aufträge`
- Kern: Letzte Mail, kein weiterer Kontakt. Tür für später offen lassen.

Die Mails werden über Instantly versendet. Pro Branche gibt es eine eigene Instantly-Kampagne.
Nach dem Versand erhält der Betrieb den Status "kontaktiert".

---

### Funktion 5: Dashboard

Das Dashboard ist eine eigene Web-Anwendung (nicht das Zahnarzt-Dashboard).

**Pipeline-Steuerung:**
- Suchlauf starten: Branche, Kanton, Anzahl eingeben → Button "Starten"
- Extraktion starten: Alle Betriebe mit Status "entdeckt" verarbeiten
- Landing Pages generieren: Alle Betriebe mit Status "extrahiert" verarbeiten
- Outreach starten: Alle Betriebe mit Status "landing_generiert" und E-Mail kontaktieren
- Job-Fortschritt in Echtzeit anzeigen (Status, verarbeitet, Fehler, Log-Text)

**Lead-Übersicht:**
- Tabelle mit allen Betrieben
- Spalten: Firmenname, Branche, Ort, Kanton, Status, E-Mail vorhanden, Landing URL
- Filter nach Status, Branche, Kanton
- Klick auf Eintrag öffnet Detailansicht mit Firmenprofil und allen gespeicherten Feldern

---

## TEIL 2: TECHNISCHE SPEZIFIKATION

### Server-Infrastruktur

```
Anbieter:    Hetzner Cloud
IP-Adresse:  167.233.25.202
OS:          Ubuntu (gleiche Maschine wie website-agent)
SSH-User:    root
SSH-Befehl:  ssh root@167.233.25.202
```

Auf dem Server laufen zwei neue systemd-Services zusätzlich zu den bestehenden:

| Service                      | Beschreibung         | Port |
|------------------------------|----------------------|------|
| `handwerker-backend`         | FastAPI Backend      | 8002 |
| `handwerker-frontend`        | Next.js Dashboard    | 3001 |

Die bestehenden website-agent Services (Ports 8001 und 3000) laufen unverändert weiter.

**Nginx:** Zwei neue Virtual Hosts hinzufügen:

```
handwerker-api.amplifyr-digital.ch   →  FastAPI  (Port 8002)
handwerker.amplifyr-digital.ch       →  Next.js  (Port 3001)
```

Nginx-Konfiguration liegt unter `/etc/nginx/sites-available/handwerker-agent`.
SSL via Let's Encrypt (Certbot) — gleich wie bei website-agent.

**Dateistruktur auf dem Server:**
```
/opt/handwerker-agent/
├── .env                         # API Keys (Quelle der Wahrheit)
├── backend/
│   ├── .env                     # Kopie der Root-.env (für uvicorn)
│   ├── .venv/                   # Python virtual environment
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── pipeline/
│   │   ├── discovery.py
│   │   ├── extraktion.py
│   │   ├── landing_generator.py
│   │   └── outreach.py
│   ├── routers/
│   │   ├── pipeline.py
│   │   ├── betriebe.py
│   │   └── chat.py
│   ├── services/
│   │   ├── apify_client.py
│   │   ├── r2_client.py
│   │   ├── instantly_client.py
│   │   ├── gemini_client.py
│   │   └── screenshot_client.py
│   ├── templates/
│   │   └── landing_template.html   # Jinja2 Template
│   └── prompts/
│       └── outreach_prompts.py
└── frontend-dashboard/
    ├── .next/
    └── app/
```

**Services starten/stoppen:**
```bash
systemctl status handwerker-backend
systemctl restart handwerker-backend
systemctl restart handwerker-frontend
journalctl -u handwerker-backend -f   # Live-Logs
```

**Code deployen:**
```bash
# Lokal:
git add . && git commit -m "..." && git push

# Auf Server:
ssh root@167.233.25.202
cd /opt/handwerker-agent
git pull
systemctl restart handwerker-backend

# Bei Frontend-Änderungen zusätzlich:
cd /opt/handwerker-agent/frontend-dashboard
NEXT_PUBLIC_BACKEND_URL=https://handwerker-api.amplifyr-digital.ch npm run build
systemctl restart handwerker-frontend
```

**Neue Python-Library installieren:**
```bash
ssh root@167.233.25.202
cd /opt/handwerker-agent/backend
.venv/bin/pip install paketname
systemctl restart handwerker-backend
```

---

### Repository

```
GitHub-Repo: handwerker-agent (separates Repo, kein Monorepo mit website-agent)
Branch:      main
Deploy-Path: /opt/handwerker-agent
```

---

### Datenbank

PostgreSQL läuft bereits auf dem Server unter `localhost:5432`.
Neue Datenbank (Benutzer agentuser und Passwort agentpass2024 bleiben dieselben):

```sql
CREATE DATABASE handwerkerdb OWNER agentuser;
```

**DATABASE_URL in .env:**
```
DATABASE_URL=postgresql+asyncpg://agentuser:agentpass2024@localhost:5432/handwerkerdb
```

**Zugriff auf DB-Konsole:**
```bash
sudo -u postgres psql handwerkerdb
```

---

### Datenmodell

**Tabelle: betriebe**

```
place_id          VARCHAR   PRIMARY KEY   (Google Maps Place ID)
name              VARCHAR   NOT NULL      (Originalname aus Google Maps)
adresse           VARCHAR
plz               VARCHAR
ort               VARCHAR
kanton            VARCHAR
telefon           VARCHAR
email             VARCHAR
website_url       VARCHAR
website_domain    VARCHAR   INDEX         (registerable domain, z.B. "maler-hess.ch")
keine_website     BOOLEAN   DEFAULT false

-- Google Maps Daten
google_rating     NUMERIC(3,1)
google_anzahl     INTEGER
oeffnungszeiten   JSONB
koordinaten       JSONB                   ({"lat": ..., "lng": ...})
google_reviews_raw JSONB                  (Top-5 Bewertungen)

-- Extraktion
name_anzeige      VARCHAR               (bereinigter Anzeigename)
inhaber_name      VARCHAR               (Name des Chefs / Inhabers)
farbe_primary     VARCHAR               (Hex-Farbe, z.B. "#2e7d32")
hat_logo          BOOLEAN
logo_url          VARCHAR               (öffentliche R2-URL des Logos)
firmenprofil      TEXT                  (KI-generierte Zusammenfassung)
extrahiert_am     TIMESTAMPTZ

-- Landing Page
slug              VARCHAR   UNIQUE       (z.B. "maler-hess-ag-zuerich")
landing_url       VARCHAR               (öffentliche URL der Landing Page)
landing_generiert_am TIMESTAMPTZ

-- Outreach
outreach_status   VARCHAR               (NULL / 'bereit_zum_versand' / 'in_kampagne')
email_status      VARCHAR   DEFAULT 'unbekannt'   ('unbekannt' / 'valid' / 'invalid')
optout            BOOLEAN   DEFAULT false
letzter_kontakt_am TIMESTAMPTZ

-- Pipeline
status            VARCHAR   DEFAULT 'entdeckt'   INDEX
branche           VARCHAR               (z.B. "Maler", "Elektriker")
fehler_log        TEXT
entdeckt_am       TIMESTAMPTZ           DEFAULT now()
```

**Status-Werte (CHECK Constraint):**
```
'entdeckt' → 'extrahiert' → 'landing_generiert' → 'kontaktiert' → 'fehler'
'kein_website'  (Sackgasse, für später aufbewahrt)
```

**Tabelle: kontaktversuche**
```
id            INTEGER   PRIMARY KEY   AUTOINCREMENT
place_id      VARCHAR   FK → betriebe.place_id CASCADE DELETE
typ           VARCHAR   ('email' / 'followup1' / 'followup2' / 'manuell')
email_adresse VARCHAR
email_subject VARCHAR
email_text    TEXT
gesendet_am   TIMESTAMPTZ
```

**Tabelle: jobs**
```
id              INTEGER   PRIMARY KEY   AUTOINCREMENT
typ             VARCHAR   CHECK: 'discovery' / 'extraktion' / 'landing' / 'outreach' /
                                 'discovery+extraktion' / 'extraktion+landing' / 'full'
gestartet_am    TIMESTAMPTZ   DEFAULT now()
abgeschlossen_am TIMESTAMPTZ
status          VARCHAR   DEFAULT 'laufend'   ('laufend' / 'abgeschlossen' / 'fehler')
total           INTEGER
verarbeitet     INTEGER   DEFAULT 0
fehler          INTEGER   DEFAULT 0
log             TEXT
```

---

### Umgebungsvariablen (.env)

```env
# Datenbank (neue DB, gleicher PostgreSQL-Server)
DATABASE_URL=postgresql+asyncpg://agentuser:agentpass2024@localhost:5432/handwerkerdb

# Apify — ÜBERNOMMEN vom Zahnarzt-Projekt (gleicher Account, kein Konflikt)
APIFY_API_TOKEN=...

# Gemini — NEUER KEY (eigenes Projekt, separate Abrechnung)
GEMINI_API_KEY=...

# Kein Anthropic — nur Gemini für alle KI-Aufgaben

# Cloudflare R2 — ÜBERNOMMEN (gleicher Bucket, Prefix "handwerker/" trennt alles)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=website-agent-bilder
R2_PUBLIC_URL=https://pub-....r2.dev

# Instantly — KEY ÜBERNOMMEN, Kampagnen-IDs NEU (pro Branche eine eigene Kampagne)
INSTANTLY_KEY=...
INSTANTLY_CAMPAIGN_ID_MALER=...
INSTANTLY_CAMPAIGN_ID_ELEKTRIKER=...
INSTANTLY_CAMPAIGN_ID_SCHREINER=...
INSTANTLY_CAMPAIGN_ID_SANITAER=...
INSTANTLY_CAMPAIGN_ID_DACHDECKER=...

# Landing Pages
LANDING_DOMAIN=ihr-ki-agent.ch
CHAT_API_URL=https://handwerker-api.amplifyr-digital.ch/api/v1/chat/message
```

---

### Backend (FastAPI)

**Einstiegspunkt:** `backend/main.py`

```python
app = FastAPI(title="Handwerker Agent API", version="1.0.0")

# CORS — erlaubte Origins:
# http://localhost:3001              → lokales Dev-Frontend
# https://handwerker.amplifyr-digital.ch  → Prod-Frontend
# https://ihr-ki-agent.ch           → Landing Pages (Chat-Requests)

# Routers:
# /api/v1/pipeline  → pipeline.py
# /api/v1/betriebe  → betriebe.py
# /api/v1/chat      → chat.py

# Health-Check: GET /health → DB-Ping
```

**config.py:** Pydantic BaseSettings, liest `.env` und `../.env`.

**database.py:** SQLAlchemy async engine, `create_async_engine`, pool_size=15, max_overflow=5.
`create_tables()` via `Base.metadata.create_all` + idempotente ALTER TABLE Statements für
spätere Schema-Migrationen.

---

### Pipeline-Module

#### pipeline/discovery.py

Suchbegriffe werden als `{branche} {kanton} Schweiz` aufgebaut.
Apify Actor: `compass~crawler-google-places`

Apify-Input:
```python
{
    "searchStringsArray": [...],
    "maxCrawledPlacesPerSearch": max_per_search,
    "language": "de",
    "maxReviews": 5,
    "reviewsSort": "newest",
    "includeWebResults": False,
    "countryCode": "ch",
}
```

Parsing pro Ergebnis:
- Überspringe wenn `permanentlyClosed=true`
- Überspringe wenn countryCode nicht CH
- Duplikatschutz: In-Memory-Set der Domains im aktuellen Lauf + DB-Check auf `website_domain`
- INSERT ... ON CONFLICT DO NOTHING (Idempotenz per place_id)
- `branche`-Feld aus dem Frontend-Parameter mitsetzen

#### pipeline/extraktion.py

Verarbeitet alle Betriebe mit `status='entdeckt'` (und `keine_website=false`).

Für jeden Betrieb:

1. **Website laden:** HTTP GET auf `website_url`, Timeout 15s, User-Agent setzen.
   Bei Fehler: `status='fehler'`, `fehler_log` setzen, weitermachen.

2. **Unterseiten finden:** Links aus HTML parsen die auf Über-uns, Team, Impressum, Kontakt
   hinweisen (URL-Keywords oder Link-Text-Keywords). Max. 5 Unterseiten laden.

3. **Text bereinigen:** Script/Style/SVG/Noscript-Tags entfernen, restlichen Text extrahieren.
   Gesamter Text aus Startseite + Unterseiten zusammenführen.

4. **Logo finden:** Bild-URL aus `<img>` mit "logo" in src/alt/class/id. Bild herunterladen,
   nach R2 hochladen unter Key `handwerker/{place_id}/logo.{ext}`.

5. **Primärfarbe extrahieren:** Zuerst aus CSS (Navbar/Button-Hintergrundfarben per Regex).
   Fallback: Screenshot der Startseite mit Playwright (headless Chromium, 1280×800) →
   Screenshot-Bytes an Gemini Flash übergeben.
   Gemini-Prompt: Identifiziere die dominante Brandfarbe (Navbar, CTA-Buttons, Akzente).
   Ignoriere Weiss, Hellgrau, Schwarz. Antworte nur mit Hex-Code oder "none".
   Screenshot wird unter Key `handwerker/{place_id}/screenshot.jpg` in R2 gespeichert.

6. **E-Mail extrahieren:** Regex auf HTML nach mailto: Links und plaintext E-Mail-Adressen.
   Erste gefundene gültige Adresse nehmen (Format validieren).

7. **Inhaber-Name extrahieren:** Gemini Flash Call auf den bereinigten Text.
   Prompt: Finde den Namen des Inhabers oder Geschäftsführers. Nur Name, kein Titel. Null
   wenn nicht eindeutig erkennbar.

8. **Firmenprofil erstellen:** Gemini Flash Call auf den gesamten bereinigten Text.
   Prompt: Schreibe ein kurzes Firmenprofil für diesen Handwerksbetrieb. Nutze alle
   verfügbaren Informationen (Gründungsjahr, Grösse, Spezialgebiet, Inhaber, Standort,
   Besonderheiten). Schreibe so ausführlich wie der Informationsgehalt es erlaubt —
   von 2 Sätzen bis zu einem Absatz. Keine erfundenen Informationen.

9. **DB speichern:** Alle extrahierten Felder schreiben, `status='extrahiert'`,
   `extrahiert_am=now()`.

#### pipeline/landing_generator.py

Verarbeitet alle Betriebe mit `status='extrahiert'`.

Für jeden Betrieb:

1. **Slug generieren:** Aus `name_anzeige` + `ort`. Kleinbuchstaben, Sonderzeichen ersetzen
   (Umlaute: ä→ae, ö→oe, ü→ue), Leerzeichen → Bindestrich, Sonderzeichen entfernen.
   Auf Eindeutigkeit prüfen (DB-Check), bei Konflikt Zahl anhängen.

2. **Einleitung generieren:** Gemini Flash Call mit Firmenprofil als Input.
   Prompt: Schreibe 2–4 Sätze als persönliche Ansprache für {firmenname} in {ort}.
   Gehe spezifisch auf die Firma ein: [inhaber_name, branche, besonderheiten aus firmenprofil].
   Spreche die Firma direkt an (Sie-Form). Kein Marketing-Sprech.

3. **HTML aus Jinja2-Template rendern:** Template-Variablen:
   - `firmenname` → `name_anzeige`
   - `einleitung` → generierter Text
   - `farbe_primary` → Hex-Farbe
   - `logo_url` → R2-URL des Logos
   - `slug` → für Chat-API-Endpunkt

4. **HTML nach R2 hochladen:** Key `handwerker/{slug}/index.html`, Content-Type `text/html`.

5. **DB speichern:** `slug`, `landing_url`, `status='landing_generiert'`,
   `landing_generiert_am=now()`.

**Landing URL Format:** `https://ihr-ki-agent.ch/{slug}`

#### pipeline/outreach.py

Verarbeitet alle Betriebe mit `status='landing_generiert'`, `email IS NOT NULL`,
`optout=false`, `outreach_status IS NULL`.

Für jeden Betrieb:
1. Cold Mail, Follow-up 1, Follow-up 2 aus Templates bauen (Variablen: firmenname, landing_url)
2. Instantly `add_contact()` aufrufen mit Campaign-ID der entsprechenden Branche
3. Kontaktversuch in `kontaktversuche`-Tabelle speichern (typ='email')
4. Betrieb: `outreach_status='in_kampagne'`, `status='kontaktiert'`, `letzter_kontakt_am=now()`

---

### Services

#### services/apify_client.py

```python
ACTOR_ID = "compass~crawler-google-places"

DEUTSCHSCHWEIZER_KANTONE = [
    "Zürich", "Bern", "Luzern", "Uri", "Schwyz",
    "Obwalden", "Nidwalden", "Glarus", "Zug", "Solothurn",
    "Basel-Stadt", "Basel-Landschaft", "Schaffhausen",
    "Appenzell Ausserrhoden", "Appenzell Innerrhoden",
    "St. Gallen", "Thurgau", "Aargau",
]

def get_search_queries(branche: str, kanton_filter: str = "") -> list[str]:
    # Kombiniert: "{branche} {kanton} Schweiz" für alle/gefilterten Kantone

def run_scraper(queries: list[str], max_per_search: int) -> list[dict]:
    # ApifyClient(settings.APIFY_API_TOKEN)
    # actor(ACTOR_ID).call(run_input=...)
    # Wartet auf Abschluss, gibt items zurück
```

#### services/r2_client.py

Identisch mit website-agent r2_client.py. Boto3 S3-kompatibler Client gegen
Cloudflare R2 Endpoint: `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

```python
def upload_bytes(data: bytes, key: str, content_type: str) -> str:
    # put_object nach R2, gibt "{R2_PUBLIC_URL}/{key}" zurück

def upload_html(html: str, key: str) -> str:
    # Wrapper für HTML-Upload mit content_type="text/html; charset=utf-8"
```

#### services/instantly_client.py

REST API gegen `https://api.instantly.ai/api/v2`.
Header: `Authorization: Bearer {INSTANTLY_KEY}`

```python
def add_contact(
    email: str,
    campaign_id: str,
    firmenname: str,
    landing_url: str,
    email_text: str,
    subject: str,
    followup1_subject: str, followup1_text: str,
    followup2_subject: str, followup2_text: str,
) -> bool:
    # POST /leads mit campaign_id + variables dict
    # INSTANTLY_DRY_RUN=true → loggt nur, sendet nicht
```

#### services/gemini_client.py

Gemini 2.5 Flash via `google.generativeai`.
Einmalig konfiguriert per `genai.configure(api_key=settings.GEMINI_API_KEY)`.

Funktionen für Handwerker:
```python
def extract_primary_color(screenshot_bytes: bytes) -> Optional[str]:
    # Screenshot → Hex-Farbe oder None

def extract_logo_info(logo_bytes: bytes, mime_type: str) -> dict:
    # Logo → {"color": "#hex" | None, "name": "..." | None}
```

#### services/gemini_client.py (erweitert)

Alle KI-Aufgaben laufen über Gemini Flash (`gemini-2.5-flash`).
Konfiguriert via `genai.configure(api_key=settings.GEMINI_API_KEY)`.

```python
def extract_primary_color(screenshot_bytes: bytes) -> Optional[str]:
    # Screenshot → Hex-Farbe oder None

def extract_logo_info(logo_bytes: bytes, mime_type: str) -> dict:
    # Logo → {"color": "#hex" | None, "name": "..." | None}

def extract_inhaber(text: str) -> Optional[str]:
    # Website-Text → Name des Inhabers oder None

def generate_firmenprofil(text: str, branche: str) -> str:
    # Gesamter Website-Text → Firmenprofil als String

def generate_einleitung(firmenprofil: str, firmenname: str, ort: str, branche: str) -> str:
    # Firmenprofil → 2-4 Sätze persönliche Ansprache für Landing Page
```

---

### API-Endpunkte (Backend)

**Router: /api/v1/pipeline**

Alle Pipeline-Schritte sind einzeln und in Kombination aufrufbar. Jeder Aufruf erstellt
einen Job-Eintrag und läuft im Hintergrund (asyncio.create_task). Der Aufrufer bekommt
sofort job_id zurück und kann den Fortschritt per WebSocket oder Polling verfolgen.

```
# ── Einzelne Schritte ─────────────────────────────────────────────────────────

POST /api/v1/pipeline/discovery/start
     Body: {"branche": "Maler", "kanton": "Zürich", "max_per_search": 100}
     → Nur Discovery. Speichert Betriebe in DB, setzt status='entdeckt'.

POST /api/v1/pipeline/extraktion/start
     Body: {"place_id": "..."} optional — sonst alle Betriebe mit status='entdeckt'
     → Nur Extraktion. Scraped Website, extrahiert Logo/Farbe/E-Mail/Inhaber/Firmenprofil.

POST /api/v1/pipeline/landing/start
     Body: {"place_id": "..."} optional — sonst alle Betriebe mit status='extrahiert'
     → Nur Landing-Page-Generierung. Rendert HTML, lädt nach R2 hoch.

POST /api/v1/pipeline/outreach/start
     Body: {} — verarbeitet alle Betriebe mit status='landing_generiert' und E-Mail
     → Nur Outreach. Fügt Kontakte zu Instantly-Kampagne hinzu.

# ── Kombinierte Läufe ─────────────────────────────────────────────────────────

POST /api/v1/pipeline/discovery-extraktion/start
     Body: {"branche": "Maler", "kanton": "Zürich", "max_per_search": 100}
     → Discovery → Extraktion nacheinander (ein Job, zwei Schritte im Log).

POST /api/v1/pipeline/extraktion-landing/start
     Body: {"place_id": "..."} optional
     → Extraktion → Landing-Generierung nacheinander.

POST /api/v1/pipeline/full/start
     Body: {"branche": "Maler", "kanton": "Zürich", "max_per_search": 100}
     → Gesamte Pipeline: Discovery → Extraktion → Landing → Outreach.
     → Läuft nur einmal gleichzeitig (409 wenn bereits aktiv).

# ── Job-Management ─────────────────────────────────────────────────────────────

GET  /api/v1/pipeline/jobs
     → Letzte 20 Jobs (id, typ, status, total, verarbeitet, fehler, log, timestamps)

GET  /api/v1/pipeline/jobs/{job_id}
     → Detail-Job inkl. vollem Log

PATCH /api/v1/pipeline/jobs/{job_id}/cancel
     → Hängenden Job manuell auf "fehler" setzen

WS   /api/v1/pipeline/ws/jobs/{job_id}
     → WebSocket: sendet Job-Status alle 2 Sekunden, schliesst bei abgeschlossen/fehler
```

**Router: /api/v1/betriebe**

```
GET  /api/v1/betriebe
     Query-Params: status, branche, kanton, limit=50, offset=0
     → Gefilterte Liste der Betriebe

GET  /api/v1/betriebe/{place_id}
     → Detail eines Betriebs inkl. aller Felder und Kontaktversuche

PATCH /api/v1/betriebe/{place_id}
     → Manuelle Korrekturen (email, optout, status)
```

**Chat-Endpunkt (für Landing Page Chatbot):**

```
POST /api/v1/chat/message
     Body: {"message": "...", "history": [...]}
     → Amplifyr-Verkäufer-Bot antwortet via Gemini Flash
     → Kein slug nötig, der Bot kennt nur das Amplifyr-Angebot (kein Betriebskontext)
     → Rate-Limiting: 30 Requests pro IP pro 60 Sekunden
     → Max. Nachrichtenlänge: 2000 Zeichen
```

---

### Chatbot (Amplifyr-Verkäufer)

Der Chatbot auf der Landing Page ist ein Gemini-Chat mit festem System-Prompt.
Der System-Prompt beschreibt Amplifyr's Angebot vollständig: Produkte, Preise, Ablauf,
Zielgruppe, USPs, Terminbuchungs-Link.

Antwortregeln:
- Deutsch, Sie-Form
- Kein Markdown (keine Sternchen, Rauten, Bindestriche als Listen)
- Kein Emoji
- Erlaubtes HTML: `<strong>`, `<br>`, `<a href="...">`
- So kurz wie möglich
- Aktiv auf Terminvereinbarung hinlenken

**System-Prompt (Platzhalter — wird vor Go-Live präzisiert):**

```
Du bist der digitale Berater von Amplifyr — einer Schweizer Firma die Handwerksbetrieben
KI-Assistenten baut.

Deine Aufgabe: Fragen des Handwerkers beantworten und ein Gespräch mit dem Amplifyr-Team
vereinbaren.

ANGEBOT (Platzhalter):
- KI-Assistent der Kundenanfragen 24/7 beantwortet (Website + optional WhatsApp)
- Einrichtung in [X] Wochen, keine technischen Kenntnisse nötig
- Kosten: [Preis einfügen] — monatlich, kündbar
- Inklusive: Setup, Anpassungen, Support

GESPRÄCHSZIEL:
Jedes Gespräch soll in einem Termin mit dem Amplifyr-Team enden.
Kalender-Link: [LINK EINFÜGEN]

REGELN:
- Deutsch, Sie-Form
- Kein Markdown, kein Emoji
- Erlaubtes HTML: <strong>, <br>, <a href="...">
- Kurz und direkt
- Bei Preisfragen: Richtwert nennen, für genaues Angebot Termin empfehlen
- Nie versprechen was nicht im Angebot steht
```

---

### Cloudflare Worker (Landing Pages)

Die Landing Pages werden über einen Cloudflare Worker ausgeliefert.
URL-Schema: `https://ihr-ki-agent.ch/{slug}`

**Setup-Schritte (einmalig):**
1. Domain `ihr-ki-agent.ch` bei Registrar kaufen
2. DNS auf Cloudflare-Nameserver zeigen (im Registrar-Panel)
3. In Cloudflare: Domain zum Account hinzufügen
4. In Cloudflare R2: Bucket `website-agent-bilder` → "Public Access" aktivieren (bereits aktiv)
5. Worker erstellen: Cloudflare Dashboard → Workers → New Worker
6. Route setzen: `ihr-ki-agent.ch/*` → Worker
7. R2-Binding im Worker: Variable `R2` → Bucket `website-agent-bilder`

**Worker-Logik:**
```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const slug = url.pathname.replace(/^\//, "").split("/")[0];
    if (!slug) return new Response("Not found", { status: 404 });

    const key = `handwerker/${slug}/index.html`;
    const obj = await env.R2.get(key);
    if (!obj) return new Response("Not found", { status: 404 });

    return new Response(obj.body, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
};
```

Worker liegt im Repo unter `cloudflare-worker/worker-handwerker.js`.
Konfiguration: `cloudflare-worker/wrangler-handwerker.toml`
Deployment via Wrangler CLI: `wrangler deploy --config wrangler-handwerker.toml`

**Unterschied zu `ihr-ki-assistent.ch`:** Gleiche Architektur, anderer R2-Prefix
(`handwerker/` statt `chatbot/`) und andere Domain. Beide Worker laufen unabhängig
voneinander im gleichen Cloudflare-Account.

---

### Frontend (Next.js Dashboard)

**Tech-Stack:** Next.js 14, TypeScript, Tailwind CSS
**Build-Command:** `NEXT_PUBLIC_BACKEND_URL=https://handwerker-api.amplifyr-digital.ch npm run build`
**Port:** 3001 (lokal und auf Server)

**Seiten:**

`/` → Redirect zu `/pipeline`

`/pipeline`
- Job-Steuerung: Formular mit Branche (Dropdown), Kanton (Dropdown oder leer), Anzahl
- Buttons: "Discovery starten", "Extraktion starten", "Landing Pages generieren",
  "Outreach starten", "Alles starten"
- Job-Liste: Tabelle mit letzten 20 Jobs, Live-Fortschritt via WebSocket

`/betriebe`
- Tabelle mit Filter (Status, Branche, Kanton)
- Spalten: Name, Branche, Ort, Status, E-Mail, Landing-URL (klickbar)
- Paginierung

`/betriebe/{place_id}`
- Detail-Ansicht: alle DB-Felder, Firmenprofil, Logo-Vorschau
- Kontaktversuche-Liste
- Bearbeiten: E-Mail, Optout-Toggle

**API-Kommunikation:** Fetch gegen `NEXT_PUBLIC_BACKEND_URL`.

---

### Jinja2 Landing Page Template

Das Template liegt unter `backend/templates/landing_template.html`.
Variablen im Template (Jinja2-Syntax):
```
{{ firmenname }}      → Firmenname des Betriebs
{{ einleitung }}      → KI-generierte persönliche Einleitung (sicheres HTML)
{{ farbe_primary }}   → Hex-Farbe, z.B. "#2e7d32"
{{ logo_url }}        → R2-URL des Logos (oder leer wenn kein Logo)
{{ slug }}            → Für den Chat-API-Aufruf
{{ chat_api_url }}    → Basis-URL des Chat-Endpunkts
```

Das vollständige Template-Design wird in Phase 2 definiert.

---

### systemd Service-Definitionen

**/etc/systemd/system/handwerker-backend.service:**
```ini
[Unit]
Description=Handwerker Agent Backend
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/handwerker-agent/backend
ExecStart=/opt/handwerker-agent/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8002 --workers 1
Restart=always
RestartSec=5
EnvironmentFile=/opt/handwerker-agent/.env

[Install]
WantedBy=multi-user.target
```

**/etc/systemd/system/handwerker-frontend.service:**
```ini
[Unit]
Description=Handwerker Agent Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/handwerker-agent/frontend-dashboard
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

Nach Anlegen:
```bash
systemctl daemon-reload
systemctl enable handwerker-backend handwerker-frontend
systemctl start handwerker-backend handwerker-frontend
```

---

### Python-Abhängigkeiten (requirements.txt)

```
fastapi
uvicorn[standard]
sqlalchemy[asyncio]
asyncpg
pydantic-settings
apify-client
google-generativeai
boto3
botocore
requests
beautifulsoup4
tldextract
jinja2
playwright          # für Screenshots (headless Chromium)
```

Nach Installation Playwright-Browser einmalig herunterladen:
```bash
.venv/bin/playwright install chromium
```

---

## Offene Punkte (Phase 2)

- Landing Page Inhalt ✓
- Domain: `ihr-ki-agent.ch` ✓
- Mail-Texte finalisieren (Platzhalter vorhanden)
- Bot System-Prompt finalisieren — Preise, Kalender-Link, USPs eintragen
- Design/Layout des Next.js Dashboards
