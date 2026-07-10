#!/bin/bash
set -e

echo "=== Handwerker Agent Server Setup ==="

# ── Datenbank ──────────────────────────────────────────────────────────────────
echo "[1/6] Datenbank anlegen..."
sudo -u postgres psql -c "CREATE DATABASE handwerkerdb OWNER agentuser;" 2>/dev/null || echo "DB existiert bereits."

# ── Repo klonen ────────────────────────────────────────────────────────────────
echo "[2/6] Repo klonen..."
if [ ! -d /opt/handwerker-agent ]; then
    git clone https://github.com/DEIN-ORG/handwerker-agent.git /opt/handwerker-agent
else
    cd /opt/handwerker-agent && git pull
fi

# ── .env vorbereiten ──────────────────────────────────────────────────────────
echo "[3/6] .env kopieren..."
if [ ! -f /opt/handwerker-agent/.env ]; then
    cp /opt/website-agent/.env /opt/handwerker-agent/.env.base
    cp /opt/handwerker-agent/.env.example /opt/handwerker-agent/.env
    echo ""
    echo "WICHTIG: /opt/handwerker-agent/.env jetzt befüllen!"
    echo "Werte aus /opt/handwerker-agent/.env.base übernehmen (Apify, R2, Instantly Key)"
    echo "Dann GEMINI_API_KEY und INSTANTLY_CAMPAIGN_IDs eintragen."
    echo ""
fi

# ── Python venv + Dependencies ────────────────────────────────────────────────
echo "[4/6] Python-Umgebung einrichten..."
cd /opt/handwerker-agent/backend
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r ../requirements.txt
.venv/bin/playwright install chromium --with-deps

# ── Frontend bauen ─────────────────────────────────────────────────────────────
echo "[5/6] Frontend bauen..."
cd /opt/handwerker-agent/frontend-dashboard
npm install
NEXT_PUBLIC_BACKEND_URL=https://handwerker-api.amplifyr-digital.ch npm run build

# ── systemd Services ──────────────────────────────────────────────────────────
echo "[6/6] Services einrichten..."
cp /opt/handwerker-agent/server/handwerker-backend.service /etc/systemd/system/
cp /opt/handwerker-agent/server/handwerker-frontend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable handwerker-backend handwerker-frontend
systemctl start handwerker-backend handwerker-frontend

# ── Nginx ─────────────────────────────────────────────────────────────────────
cp /opt/handwerker-agent/server/nginx-handwerker-agent /etc/nginx/sites-available/handwerker-agent
ln -sf /etc/nginx/sites-available/handwerker-agent /etc/nginx/sites-enabled/handwerker-agent
nginx -t && systemctl reload nginx

# SSL
certbot --nginx -d handwerker-api.amplifyr-digital.ch -d handwerker.amplifyr-digital.ch --non-interactive --agree-tos -m admin@amplifyr.ch

echo ""
echo "=== Setup abgeschlossen ==="
echo "Status prüfen:"
echo "  systemctl status handwerker-backend"
echo "  systemctl status handwerker-frontend"
echo "  journalctl -u handwerker-backend -f"
