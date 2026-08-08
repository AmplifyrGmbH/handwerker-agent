"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Betrieb, Kontaktversuch,
  LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, ALL_LEAD_STATUSES,
  STATUS_LABELS, STATUS_COLORS,
} from "@/types";

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="py-2 border-b border-gray-50">
      <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-800 break-words">{String(value)}</dd>
    </div>
  );
}

export default function BetriebDetailPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = params?.place_id as string;

  const [betrieb, setBetrieb] = useState<Betrieb | null>(null);
  const [loading, setLoading] = useState(true);

  // Anruf-Formular
  const [anrufNotizen, setAnrufNotizen] = useState("");
  const [anrufErgebnis, setAnrufErgebnis] = useState("nicht_erreicht");
  const [callbackDatum, setCallbackDatum] = useState("");
  const [savingAnruf, setSavingAnruf] = useState(false);
  const [anrufMsg, setAnrufMsg] = useState("");

  // Demo
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [demoMsg, setDemoMsg] = useState("");
  const [bearbeitenPrompt, setBearbeitenPrompt] = useState("");
  const [bearbeiting, setBearbeiting] = useState(false);
  const [bearbeitenMsg, setBearbeitenMsg] = useState("");

  useEffect(() => {
    if (!placeId) return;
    apiFetch<Betrieb>(`/api/v1/betriebe/${encodeURIComponent(placeId)}`)
      .then((b) => {
        setBetrieb(b);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [placeId]);

  const reload = () => {
    if (!placeId) return;
    apiFetch<Betrieb>(`/api/v1/betriebe/${encodeURIComponent(placeId)}`)
      .then(setBetrieb)
      .catch(() => {});
  };

  const saveLeadStatus = async (newStatus: string) => {
    if (!betrieb) return;
    const updated = await apiFetch<Betrieb>(
      `/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}`,
      { method: "PATCH", body: JSON.stringify({ lead_status: newStatus }) }
    );
    setBetrieb(updated);
  };

  const submitAnruf = async () => {
    if (!betrieb) return;
    setSavingAnruf(true);
    setAnrufMsg("");
    try {
      await apiFetch(`/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}/anruf`, {
        method: "POST",
        body: JSON.stringify({
          notizen: anrufNotizen,
          ergebnis: anrufErgebnis,
          callback_datum: callbackDatum || null,
        }),
      });
      setAnrufNotizen("");
      setCallbackDatum("");
      setAnrufMsg("Anruf gespeichert");
      reload();
    } catch {
      setAnrufMsg("Fehler beim Speichern");
    } finally {
      setSavingAnruf(false);
    }
  };

  const generiereDemo = async () => {
    if (!betrieb) return;
    setGeneratingDemo(true);
    setDemoMsg("");
    try {
      await apiFetch(`/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}/demo/generieren`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setDemoMsg("Demo-Generierung gestartet — Seite in 30s neu laden");
    } catch (e: unknown) {
      setDemoMsg((e as Error).message || "Fehler");
    } finally {
      setGeneratingDemo(false);
    }
  };

  const bearbeitDemo = async () => {
    if (!betrieb || !bearbeitenPrompt.trim()) return;
    setBearbeiting(true);
    setBearbeitenMsg("");
    try {
      await apiFetch(`/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}/demo/bearbeiten`, {
        method: "POST",
        body: JSON.stringify({ prompt: bearbeitenPrompt }),
      });
      setBearbeitenMsg("Demo aktualisiert — Seite neu laden um Änderungen zu sehen");
      setBearbeitenPrompt("");
    } catch (e: unknown) {
      setBearbeitenMsg((e as Error).message || "Fehler");
    } finally {
      setBearbeiting(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-6 py-8 text-gray-400">Lädt...</div>;
  if (!betrieb) return <div className="max-w-7xl mx-auto px-6 py-8 text-red-500">Betrieb nicht gefunden.</div>;

  const leadColor = LEAD_STATUS_COLORS[betrieb.lead_status] || "bg-gray-100 text-gray-600";
  const pipelineColor = STATUS_COLORS[betrieb.status] || "bg-gray-100 text-gray-600";
  const anrufe = (betrieb.kontaktversuche || []).filter((k) => k.typ === "anruf");

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline mb-6 block">
        ← Zurück
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        {betrieb.logo_url && (
          <img src={betrieb.logo_url} alt="Logo" className="h-14 w-auto object-contain rounded border border-gray-100 p-1" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{betrieb.name_anzeige || betrieb.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${leadColor}`}>
              {LEAD_STATUS_LABELS[betrieb.lead_status] || betrieb.lead_status}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${pipelineColor}`}>
              {STATUS_LABELS[betrieb.status] || betrieb.status}
            </span>
            {betrieb.branche && <span className="text-sm text-gray-500">{betrieb.branche}</span>}
          </div>
        </div>
      </div>

      {/* Firmenprofil */}
      {betrieb.firmenprofil && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Firmenprofil</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{betrieb.firmenprofil}</p>
        </div>
      )}

      {/* Medien */}
      {(betrieb.logo_url || betrieb.hero_url) && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Medien</h2>
          <div className="flex gap-6 items-start flex-wrap">
            {betrieb.logo_url && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Logo</p>
                <img src={betrieb.logo_url} alt="Logo" className="h-20 w-auto max-w-[200px] object-contain rounded border border-gray-100 p-2 bg-gray-50" />
              </div>
            )}
            {betrieb.hero_url && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Hero-Bild</p>
                <img src={betrieb.hero_url} alt="Hero" className="h-40 w-auto max-w-xs object-cover rounded border border-gray-100" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Stammdaten */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Stammdaten</h2>
          <dl>
            <Field label="Adresse" value={[betrieb.adresse, betrieb.plz, betrieb.ort].filter(Boolean).join(", ")} />
            <Field label="Kanton" value={betrieb.kanton} />
            <Field label="Telefon" value={betrieb.telefon} />
            <Field label="E-Mail" value={betrieb.email} />
            {betrieb.website_url && (
              <div className="py-2 border-b border-gray-50">
                <dt className="text-xs text-gray-400 mb-0.5">Website</dt>
                <dd><a href={betrieb.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{betrieb.website_url}</a></dd>
              </div>
            )}
            <Field label="Google Bewertung" value={betrieb.google_rating != null ? `${betrieb.google_rating} (${betrieb.google_anzahl} Bewertungen)` : null} />
            <Field label="Entdeckt am" value={betrieb.entdeckt_am ? new Date(betrieb.entdeckt_am).toLocaleString("de-CH") : null} />
          </dl>
        </div>

        {/* Extrahierte Daten */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Extrahierte Daten</h2>
          <dl>
            <Field label="Inhaber" value={betrieb.inhaber_name} />
            <Field label="Mitarbeiter" value={betrieb.mitarbeiter} />
            <Field label="Primärfarbe" value={betrieb.farbe_primary} />
            <Field label="Logo" value={betrieb.hat_logo === true ? "Ja" : betrieb.hat_logo === false ? "Nein" : null} />
            <Field label="Extrahiert am" value={betrieb.extrahiert_am ? new Date(betrieb.extrahiert_am).toLocaleString("de-CH") : null} />
            <Field label="Demo generiert am" value={betrieb.landing_generiert_am ? new Date(betrieb.landing_generiert_am).toLocaleString("de-CH") : null} />
          </dl>
          {betrieb.farbe_primary && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-200" style={{ backgroundColor: betrieb.farbe_primary }} />
              <span className="text-xs text-gray-400">{betrieb.farbe_primary}</span>
            </div>
          )}
        </div>

        {/* Lead-Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Lead-Status</h2>
          <div className="flex flex-wrap gap-2">
            {ALL_LEAD_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => saveLeadStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  betrieb.lead_status === s
                    ? `${LEAD_STATUS_COLORS[s]} border-transparent font-semibold`
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {LEAD_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          {betrieb.letzter_kontakt_am && (
            <p className="text-xs text-gray-400 mt-3">
              Letzter Kontakt: {new Date(betrieb.letzter_kontakt_am).toLocaleString("de-CH")}
            </p>
          )}
        </div>
      </div>

      {/* Anruf dokumentieren */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mt-6">
        <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Anruf dokumentieren</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Ergebnis</label>
            <select
              value={anrufErgebnis}
              onChange={(e) => setAnrufErgebnis(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
            >
              <option value="nicht_erreicht">Nicht erreicht</option>
              <option value="callback">Callback vereinbart</option>
              <option value="demo_gewuenscht">Demo gewünscht</option>
              <option value="kein_interesse">Kein Interesse</option>
              <option value="verkauft">Verkauft</option>
            </select>
          </div>
          {anrufErgebnis === "callback" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Callback-Datum</label>
              <input
                type="datetime-local"
                value={callbackDatum}
                onChange={(e) => setCallbackDatum(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>
        <div className="mt-3">
          <label className="block text-xs text-gray-400 mb-1">Notizen</label>
          <textarea
            value={anrufNotizen}
            onChange={(e) => setAnrufNotizen(e.target.value)}
            rows={3}
            placeholder="Gesprächsnotizen..."
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm resize-none"
          />
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={submitAnruf}
            disabled={savingAnruf}
            className="bg-gray-800 text-white text-sm px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-50"
          >
            {savingAnruf ? "Speichert..." : "Anruf speichern"}
          </button>
          {anrufMsg && <span className="text-sm text-gray-500">{anrufMsg}</span>}
        </div>
      </div>

      {/* Demo */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mt-6">
        <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Demo</h2>

        {betrieb.landing_url ? (
          <div className="space-y-4">
            {/* Demo-Vorschau */}
            <a
              href={betrieb.landing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative group overflow-hidden rounded-lg border border-gray-200"
            >
              {betrieb.hero_url ? (
                <img src={betrieb.hero_url} alt="Demo Vorschau" className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-24 bg-gradient-to-br from-slate-100 to-purple-50 flex items-center justify-center">
                  <span className="text-purple-600 font-medium text-sm">Demo öffnen →</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 text-sm font-semibold px-4 py-2 rounded-full shadow-lg transition-all">
                  Demo öffnen ↗
                </span>
              </div>
            </a>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Demo-URL</label>
              <a
                href={betrieb.landing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {betrieb.landing_url}
              </a>
            </div>

            {/* Demo bearbeiten */}
            <div className="pt-3 border-t border-gray-100">
              <label className="block text-xs text-gray-400 mb-1">Demo mit KI bearbeiten</label>
              <div className="flex gap-2 items-start">
                <textarea
                  value={bearbeitenPrompt}
                  onChange={(e) => setBearbeitenPrompt(e.target.value)}
                  rows={2}
                  placeholder="z.B. «Füge einen Abschnitt über Garantieleistungen hinzu» oder «Ändere die Primärfarbe auf Dunkelgrün»"
                  className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm resize-none"
                />
                <button
                  onClick={bearbeitDemo}
                  disabled={bearbeiting || !bearbeitenPrompt.trim()}
                  className="bg-purple-600 text-white text-sm px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {bearbeiting ? "Bearbeitet..." : "Anwenden"}
                </button>
              </div>
              {bearbeitenMsg && <p className="text-sm mt-2 text-gray-600">{bearbeitenMsg}</p>}
            </div>

            <button
              onClick={generiereDemo}
              disabled={generatingDemo}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Demo komplett neu generieren
            </button>
            {demoMsg && <p className="text-sm text-gray-600">{demoMsg}</p>}
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              {betrieb.status === "extrahiert" || betrieb.status === "landing_generiert"
                ? "Noch keine Demo erstellt."
                : "Betrieb muss zuerst extrahiert sein."}
            </p>
            {(betrieb.status === "extrahiert" || betrieb.status === "landing_generiert") && (
              <button
                onClick={generiereDemo}
                disabled={generatingDemo}
                className="bg-purple-600 text-white text-sm px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {generatingDemo ? "Generiert..." : "Demo generieren"}
              </button>
            )}
            {demoMsg && <p className="text-sm mt-2 text-gray-600">{demoMsg}</p>}
          </div>
        )}
      </div>

      {/* Anruf-Historie */}
      {anrufe.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mt-6">
          <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">
            Anruf-Historie ({anrufe.length})
          </h2>
          <div className="flex flex-col gap-3">
            {anrufe.map((k) => (
              <div key={k.id} className="border border-gray-100 rounded p-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span className="font-medium text-gray-600">Anruf</span>
                  <span>{k.gesendet_am ? new Date(k.gesendet_am).toLocaleString("de-CH") : "—"}</span>
                </div>
                {k.notizen && <p className="text-sm text-gray-700 mt-1">{k.notizen}</p>}
                {k.callback_datum && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Callback: {new Date(k.callback_datum).toLocaleString("de-CH")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fehler */}
      {betrieb.fehler_log && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-5 mt-6">
          <h2 className="font-semibold mb-2 text-sm text-red-600">Fehler-Log</h2>
          <pre className="text-xs text-red-700 whitespace-pre-wrap">{betrieb.fehler_log}</pre>
        </div>
      )}
    </div>
  );
}
