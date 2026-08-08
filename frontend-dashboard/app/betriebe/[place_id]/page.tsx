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

  // Medien-Upload
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  const uploadMedia = async (typ: "logo" | "hero", file: File) => {
    if (typ === "logo") setUploadingLogo(true);
    else setUploadingHero(true);
    try {
      const form = new FormData();
      form.append("typ", typ);
      form.append("file", file);
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8002";
      const res = await fetch(`${base}/api/v1/betriebe/${encodeURIComponent(placeId)}/upload`, {
        method: "POST", body: form,
      });
      if (res.ok) {
        setBetrieb(await res.json());
        // Demo automatisch neu generieren
        await apiFetch(`/api/v1/betriebe/${encodeURIComponent(placeId)}/demo/generieren`, {
          method: "POST", body: JSON.stringify({}),
        }).catch(() => {});
      }
    } catch { /* ignore */ }
    finally {
      if (typ === "logo") setUploadingLogo(false);
      else setUploadingHero(false);
    }
  };

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

      {/* Demo-Link */}
      {betrieb.landing_url && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mt-6">
          <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Demo</h2>
          <a href={betrieb.landing_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
            {betrieb.landing_url}
          </a>
        </div>
      )}

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
