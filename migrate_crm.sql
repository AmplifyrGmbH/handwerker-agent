-- CRM-Migration: Lead-Status + Anruf-Felder
-- Ausführen auf dem Server:
-- sudo -u postgres psql handwerkerdb -f migrate_crm.sql

-- Neue Spalten in betriebe
ALTER TABLE betriebe ADD COLUMN IF NOT EXISTS lead_status VARCHAR DEFAULT 'nicht_angerufen';
ALTER TABLE betriebe DROP COLUMN IF EXISTS outreach_status;
ALTER TABLE betriebe DROP COLUMN IF EXISTS email_status;

-- Bestehende extrahierte Betriebe auf nicht_angerufen setzen
UPDATE betriebe SET lead_status = 'nicht_angerufen' WHERE lead_status IS NULL;

-- Index
CREATE INDEX IF NOT EXISTS ix_betriebe_lead_status ON betriebe (lead_status);

-- Neue Spalten in kontaktversuche
ALTER TABLE kontaktversuche ADD COLUMN IF NOT EXISTS notizen TEXT;
ALTER TABLE kontaktversuche ADD COLUMN IF NOT EXISTS callback_datum TIMESTAMPTZ;

-- Agent + letzte Notiz (denormalisiert)
ALTER TABLE betriebe ADD COLUMN IF NOT EXISTS agent VARCHAR;
ALTER TABLE betriebe ADD COLUMN IF NOT EXISTS letzte_notiz TEXT;
ALTER TABLE betriebe ADD COLUMN IF NOT EXISTS letzte_notiz_am TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS ix_betriebe_agent ON betriebe (agent);

-- Mitarbeiter-Feld
ALTER TABLE betriebe ADD COLUMN IF NOT EXISTS mitarbeiter INTEGER;
