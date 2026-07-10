# Handwerker Agent — Projektkontext für Claude

## Server
- **Hetzner:** `167.233.25.202`, User: `root`, SSH: `ssh root@167.233.25.202`
- **OS:** Ubuntu, gleiche Maschine wie website-agent (Zahnarzt-Projekt)
- **Pfad:** `/opt/handwerker-agent/`
- **DB:** PostgreSQL `handwerkerdb`, User `agentuser`, PW `agentpass2024`
- **DB-Konsole:** `sudo -u postgres psql handwerkerdb`

## Services
| Service | Port | URL |
|---------|------|-----|
| `handwerker-backend` | 8002 | https://handwerker-api.amplifyr-digital.ch |
| `handwerker-frontend` | 3001 | https://handwerker.amplifyr-digital.ch |

```bash
systemctl status handwerker-backend
systemctl restart handwerker-backend
journalctl -u handwerker-backend -f
```

## Dashboard-Login
- **URL:** https://handwerker.amplifyr-digital.ch
- **User:** admin
- **PW:** in Nginx htpasswd (`/etc/nginx/.htpasswd`)

## Deployment
```bash
# Lokal:
git add . && git commit -m "..." && git push

# Server:
ssh root@167.233.25.202
cd /opt/handwerker-agent && git pull
systemctl restart handwerker-backend

# Frontend-Änderungen:
cd /opt/handwerker-agent/frontend-dashboard
NEXT_PUBLIC_BACKEND_URL=https://handwerker-api.amplifyr-digital.ch npm run build
cp -r .next/static .next/standalone/.next/static   # WICHTIG: static files kopieren
systemctl restart handwerker-frontend
```

## GitHub
- **Repo:** https://github.com/AmplifyrGmbH/handwerker-agent
- **Branch:** main
- **Remote:** bereits konfiguriert

## API Keys (auf Server in `/opt/handwerker-agent/.env`)
- **Apify:** aus `/opt/website-agent/.env` übernommen (gleicher Account)
- **Gemini:** eigener Key für Handwerker-Projekt (`AQ.Ab8RN6LD8...`)
- **R2:** aus website-agent übernommen, Bucket: `website-agent`, Prefix: `handwerker/`
- **Instantly:** Key aus website-agent, Campaign ID: `b507a3ce-f1ce-41ed-b40b-c91e3323a9be`

## Cloudflare
- **Account:** info@amplifyr.ch (bereits mit wrangler eingeloggt lokal)
- **Worker:** `handwerker-landing` → `ihr-ki-agent.ch/{slug}`
- **R2 Bucket:** `website-agent` (geteilt mit Zahnarzt-Projekt)
  - Handwerker-Prefix: `handwerker/`
  - Zahnarzt-Prefix: `chatbot/`
- **Worker deployen:** `cd cloudflare-worker && npx wrangler deploy --config wrangler-handwerker.toml --env=""`

## DNS
- `ihr-ki-agent.ch` → Cloudflare (Nameserver dort)
- `handwerker-api.amplifyr-digital.ch` → `167.233.25.202` (Hostpoint DNS)
- `handwerker.amplifyr-digital.ch` → `167.233.25.202` (Hostpoint DNS)

## Nginx
- Config: `/etc/nginx/sites-enabled/handwerker-agent`
- Basic Auth: `/etc/nginx/.htpasswd`
- SSL: Let's Encrypt via Certbot

## Wichtige Eigenheiten
- Frontend Standalone-Build: nach jedem `npm run build` muss `.next/static` nach `.next/standalone/.next/static` kopiert werden
- `next.config.mjs` (nicht `.ts`) — Node 20 auf dem Server unterstützt kein TypeScript direkt
- Apify SDK: `actor.call()` gibt ein `Run`-Objekt zurück → `run.default_dataset_id` (nicht `run["defaultDatasetId"]`)
- `google-generativeai` zeigt FutureWarning (deprecated) — funktioniert aber noch, TODO: auf `google-genai` migrieren
- Pipeline läuft als asyncio Background Task mit `--workers 1` in uvicorn (kein Multi-Worker)

## Landing Page
- Template: `backend/templates/landing_1c.html` (Jinja2)
- Config: `LANDING_TEMPLATE=1c` in `.env`
- Design: Branding-first, 21:47-Szene, Live-Demo-Chatbot in Unternehmensfarben
- URL-Format: `https://ihr-ki-agent.ch/{slug}`

## Pipeline-Ablauf
1. **Discovery** → Apify Google Maps → DB (status: `entdeckt`)
2. **Extraktion** → Website scrapen, Logo/Farbe/E-Mail/Firmenprofil → DB (status: `extrahiert`)
3. **Landing** → HTML generieren, nach R2 hochladen → DB (status: `landing_generiert`)
4. **Outreach** → Instantly Kampagne → DB (status: `kontaktiert`)
