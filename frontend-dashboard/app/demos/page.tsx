"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Betrieb, BetriebeListe, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/types";

const PAGE_SIZE = 50;

export default function DemosPage() {
  const [items, setItems] = useState<Betrieb[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  // Demo-Bearbeitung
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [bearbeiting, setBearbeiting] = useState(false);
  const [bearbeitenMsg, setBearbeitenMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: "landing_generiert",
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      const data = await apiFetch<BetriebeListe>(`/api/v1/betriebe?${params}`);
      setItems(data.items);
      setTotal(data.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [offset]);

  useEffect(() => { load(); }, [load]);

  const bearbeitDemo = async (placeId: string) => {
    if (!prompt.trim()) return;
    setBearbeiting(true);
    setBearbeitenMsg("");
    try {
      await apiFetch(`/api/v1/betriebe/${encodeURIComponent(placeId)}/demo/bearbeiten`, {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      setBearbeitenMsg("Demo aktualisiert");
      setPrompt("");
      setBearbeitenId(null);
    } catch (e: unknown) {
      setBearbeitenMsg((e as Error).message || "Fehler");
    } finally { setBearbeiting(false); }
  };

  const pages = Math.ceil(total / PAGE_SIZE);
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Demos</h1>
        <span className="text-sm text-gray-400">{total} Demos</span>
      </div>

      {loading && <p className="text-sm text-gray-400 py-8 text-center">Lädt…</p>}

      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">Noch keine Demos generiert</p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((b) => {
          const isOpen = bearbeitenId === b.place_id;
          const leadColor = LEAD_STATUS_COLORS[b.lead_status] || "bg-gray-100 text-gray-600";

          return (
            <div key={b.place_id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Hauptzeile */}
              <div className="flex items-center gap-4 px-5 py-3">
                {/* Logo */}
                {b.logo_url && (
                  <img src={b.logo_url} alt="" className="h-8 w-8 object-contain rounded shrink-0" />
                )}
                {b.farbe_primary && !b.logo_url && (
                  <div
                    className="h-8 w-8 rounded shrink-0 border border-gray-100"
                    style={{ background: b.farbe_primary }}
                  />
                )}

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/betriebe/${b.place_id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 text-sm"
                    >
                      {b.name_anzeige || b.name}
                    </Link>
                    {b.branche && <span className="text-xs text-gray-400">{b.branche}</span>}
                    {b.ort && <span className="text-xs text-gray-400">{b.ort}</span>}
                  </div>
                  {b.landing_generiert_am && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Generiert: {new Date(b.landing_generiert_am).toLocaleString("de-CH")}
                    </p>
                  )}
                </div>

                {/* Lead-Status */}
                <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${leadColor}`}>
                  {LEAD_STATUS_LABELS[b.lead_status] || b.lead_status}
                </span>

                {/* Demo-Link */}
                {b.landing_url && (
                  <a
                    href={b.landing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline shrink-0"
                  >
                    Demo öffnen ↗
                  </a>
                )}

                {/* Bearbeiten Toggle */}
                <button
                  onClick={() => {
                    setBearbeitenId(isOpen ? null : b.place_id);
                    setPrompt("");
                    setBearbeitenMsg("");
                  }}
                  className={`text-xs px-3 py-1.5 rounded border transition-all shrink-0 ${
                    isOpen
                      ? "bg-purple-600 text-white border-purple-600"
                      : "border-gray-200 text-gray-600 hover:border-purple-400 hover:text-purple-600"
                  }`}
                >
                  KI bearbeiten
                </button>
              </div>

              {/* Bearbeiten-Formular */}
              {isOpen && (
                <div className="border-t border-gray-100 bg-purple-50 px-5 py-4">
                  <label className="block text-xs text-gray-500 mb-2">
                    Auftrag an die KI — das HTML wird direkt aktualisiert:
                  </label>
                  <div className="flex gap-2 items-start">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={2}
                      placeholder="z.B. «Füge eine Sektion über Notfall-Service hinzu» oder «Ändere die Farben auf Dunkelblau»"
                      className="flex-1 border border-purple-200 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                      autoFocus
                    />
                    <button
                      onClick={() => bearbeitDemo(b.place_id)}
                      disabled={bearbeiting || !prompt.trim()}
                      className="bg-purple-600 text-white text-sm px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {bearbeiting ? "Bearbeitet…" : "Anwenden"}
                    </button>
                  </div>
                  {bearbeitenMsg && (
                    <p className="text-sm mt-2 text-purple-700">{bearbeitenMsg}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-gray-400">Seite {page} von {pages}</span>
          <div className="flex gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="text-sm px-3 py-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              Zurück
            </button>
            <button
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="text-sm px-3 py-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              Weiter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
