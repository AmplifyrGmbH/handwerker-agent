"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Betrieb, STATUS_LABELS, STATUS_COLORS } from "@/types";

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
  const [saving, setSaving] = useState(false);

  const [editEmail, setEditEmail] = useState("");
  const [editOptout, setEditOptout] = useState(false);

  useEffect(() => {
    if (!placeId) return;
    apiFetch<Betrieb>(`/api/v1/betriebe/${encodeURIComponent(placeId)}`)
      .then((b) => {
        setBetrieb(b);
        setEditEmail(b.email || "");
        setEditOptout(b.optout);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [placeId]);

  const save = async () => {
    if (!betrieb) return;
    setSaving(true);
    try {
      const updated = await apiFetch<Betrieb>(`/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}`, {
        method: "PATCH",
        body: JSON.stringify({ email: editEmail || null, optout: editOptout }),
      });
      setBetrieb(updated);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-6 py-8 text-gray-400">Lädt...</div>;
  }
  if (!betrieb) {
    return <div className="max-w-3xl mx-auto px-6 py-8 text-red-500">Betrieb nicht gefunden.</div>;
  }

  const statusColor = STATUS_COLORS[betrieb.status] || "bg-gray-100 text-gray-600";

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline mb-6 block">
        ← Zurück
      </button>

      <div className="flex items-start gap-4 mb-8">
        {betrieb.logo_url && (
          <img src={betrieb.logo_url} alt="Logo" className="h-14 w-auto object-contain rounded border border-gray-100 p-1" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{betrieb.name_anzeige || betrieb.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor}`}>
              {STATUS_LABELS[betrieb.status] || betrieb.status}
            </span>
            {betrieb.branche && <span className="text-sm text-gray-500">{betrieb.branche}</span>}
            {betrieb.farbe_primary && (
              <span
                className="w-4 h-4 rounded-full border border-gray-200 inline-block"
                style={{ background: betrieb.farbe_primary }}
                title={betrieb.farbe_primary}
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Stammdaten */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Stammdaten</h2>
          <dl>
            <Field label="Adresse" value={[betrieb.adresse, betrieb.plz, betrieb.ort].filter(Boolean).join(", ")} />
            <Field label="Kanton" value={betrieb.kanton} />
            <Field label="Telefon" value={betrieb.telefon} />
            <Field label="Website" value={betrieb.website_url} />
            <Field label="Google Bewertung" value={betrieb.google_rating != null ? `${betrieb.google_rating} (${betrieb.google_anzahl} Bewertungen)` : null} />
            <Field label="Inhaber" value={betrieb.inhaber_name} />
            <Field label="Entdeckt am" value={betrieb.entdeckt_am ? new Date(betrieb.entdeckt_am).toLocaleString("de-CH") : null} />
          </dl>
        </div>

        {/* Outreach */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Outreach</h2>
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1">E-Mail</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              placeholder="keine E-Mail"
            />
          </div>
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="optout"
              checked={editOptout}
              onChange={(e) => setEditOptout(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="optout" className="text-sm text-gray-700">Opt-out (kein Kontakt)</label>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Speichert..." : "Speichern"}
          </button>

          {betrieb.landing_url && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="block text-xs text-gray-400 mb-1">Landing Page</label>
              <a
                href={betrieb.landing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {betrieb.landing_url}
              </a>
            </div>
          )}

          {betrieb.outreach_status && (
            <Field label="Outreach Status" value={betrieb.outreach_status} />
          )}
          {betrieb.letzter_kontakt_am && (
            <Field label="Letzter Kontakt" value={new Date(betrieb.letzter_kontakt_am).toLocaleString("de-CH")} />
          )}
        </div>
      </div>

      {/* Firmenprofil */}
      {betrieb.firmenprofil && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mt-6">
          <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Firmenprofil</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{betrieb.firmenprofil}</p>
        </div>
      )}

      {/* Fehler */}
      {betrieb.fehler_log && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-5 mt-6">
          <h2 className="font-semibold mb-2 text-sm text-red-600">Fehler-Log</h2>
          <pre className="text-xs text-red-700 whitespace-pre-wrap">{betrieb.fehler_log}</pre>
        </div>
      )}

      {/* Kontaktversuche */}
      {betrieb.kontaktversuche && betrieb.kontaktversuche.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mt-6">
          <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Kontaktversuche</h2>
          <div className="flex flex-col gap-3">
            {betrieb.kontaktversuche.map((k) => (
              <div key={k.id} className="border border-gray-100 rounded p-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span className="font-medium text-gray-600">{k.typ}</span>
                  <span>{k.gesendet_am ? new Date(k.gesendet_am).toLocaleString("de-CH") : "—"}</span>
                </div>
                <p className="text-sm text-gray-700">{k.email_subject || "—"}</p>
                <p className="text-xs text-gray-400">{k.email_adresse}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
