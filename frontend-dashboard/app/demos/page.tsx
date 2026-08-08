"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Betrieb, BetriebeListe, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/types";

const PAGE_SIZE = 50;
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8002";

function DemoCard({ b, onUpdate }: { b: Betrieb; onUpdate: (updated: Betrieb) => void }) {
  const [open, setOpen] = useState<"ki" | "fotos" | null>(null);
  const [prompt, setPrompt] = useState("");
  const [bearbeiting, setBearbeiting] = useState(false);
  const [bearbeitenMsg, setBearbeitenMsg] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const leadColor = LEAD_STATUS_COLORS[b.lead_status] || "bg-gray-100 text-gray-600";

  const bearbeitDemo = async () => {
    if (!prompt.trim()) return;
    setBearbeiting(true);
    setBearbeitenMsg("");
    try {
      await apiFetch(`/api/v1/betriebe/${encodeURIComponent(b.place_id)}/demo/bearbeiten`, {
        method: "POST", body: JSON.stringify({ prompt }),
      });
      setBearbeitenMsg("Demo aktualisiert");
      setPrompt("");
    } catch (e: unknown) {
      setBearbeitenMsg((e as Error).message || "Fehler");
    } finally { setBearbeiting(false); }
  };

  const uploadMedia = async (typ: "logo" | "hero", file: File) => {
    if (typ === "logo") setUploadingLogo(true);
    else setUploadingHero(true);
    setUploadMsg("");
    try {
      const form = new FormData();
      form.append("typ", typ);
      form.append("file", file);
      const res = await fetch(`${BASE}/api/v1/betriebe/${encodeURIComponent(b.place_id)}/upload`, {
        method: "POST", body: form,
      });
      if (res.ok) {
        onUpdate(await res.json());
        // Demo automatisch neu generieren damit das neue Bild live geht
        setUploadMsg("Bild gespeichert — Demo wird neu generiert…");
        await apiFetch(`/api/v1/betriebe/${encodeURIComponent(b.place_id)}/demo/generieren`, {
          method: "POST", body: JSON.stringify({}),
        });
        setUploadMsg("Demo neu generiert ✓");
      }
    } catch { setUploadMsg("Fehler beim Upload"); }
    finally {
      if (typ === "logo") setUploadingLogo(false);
      else setUploadingHero(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Hauptzeile */}
      <div className="flex items-center gap-4 px-5 py-3">
        {b.logo_url ? (
          <img src={b.logo_url} alt="" className="h-8 w-8 object-contain rounded shrink-0" />
        ) : b.farbe_primary ? (
          <div className="h-8 w-8 rounded shrink-0 border border-gray-100" style={{ background: b.farbe_primary }} />
        ) : null}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/betriebe/${b.place_id}`} className="font-medium text-gray-900 hover:text-blue-600 text-sm">
              {b.name_anzeige || b.name}
            </Link>
            {b.branche && <span className="text-xs text-gray-400">{b.branche}</span>}
            {b.ort && <span className="text-xs text-gray-400">{b.ort}</span>}
          </div>
          {b.landing_generiert_am && (
            <p className="text-xs text-gray-400 mt-0.5">Generiert: {new Date(b.landing_generiert_am).toLocaleString("de-CH")}</p>
          )}
        </div>

        <button
          onClick={() => { setOpen(open === "fotos" ? null : "fotos"); }}
          className={`text-xs px-3 py-1.5 rounded border transition-all shrink-0 ${open === "fotos" ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
        >
          Fotos ersetzen
        </button>

        <button
          onClick={() => { setOpen(open === "ki" ? null : "ki"); setPrompt(""); setBearbeitenMsg(""); }}
          className={`text-xs px-3 py-1.5 rounded border transition-all shrink-0 ${open === "ki" ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-600 hover:border-purple-400 hover:text-purple-600"}`}
        >
          KI bearbeiten
        </button>

        {b.landing_url && (
          <a href={b.landing_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline shrink-0 font-medium">
            Demo öffnen ↗
          </a>
        )}
      </div>

      {/* Fotos-Panel */}
      {open === "fotos" && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 flex flex-col gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-2">Logo</p>
            {b.logo_url && <img src={b.logo_url} alt="Logo" className="h-14 w-auto max-w-[160px] object-contain rounded border border-gray-100 bg-white p-1 mb-2" />}
            <label className={`cursor-pointer text-xs px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors ${uploadingLogo ? "opacity-40 pointer-events-none" : ""}`}>
              {uploadingLogo ? "Lädt…" : "Logo ersetzen"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia("logo", f); e.target.value = ""; }} />
            </label>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">Hero-Bild</p>
            {b.hero_url && <img src={b.hero_url} alt="Hero" className="h-24 w-auto max-w-[200px] object-cover rounded border border-gray-100 mb-2" />}
            <label className={`cursor-pointer text-xs px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors ${uploadingHero ? "opacity-40 pointer-events-none" : ""}`}>
              {uploadingHero ? "Lädt…" : "Hero-Bild ersetzen"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia("hero", f); e.target.value = ""; }} />
            </label>
          </div>
          {uploadMsg && <p className="text-xs text-gray-500">{uploadMsg}</p>}
        </div>
      )}

      {/* KI-Panel */}
      {open === "ki" && (
        <div className="border-t border-gray-100 bg-purple-50 px-5 py-4">
          <label className="block text-xs text-gray-500 mb-2">Auftrag an die KI — das HTML wird direkt aktualisiert:</label>
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
              onClick={bearbeitDemo}
              disabled={bearbeiting || !prompt.trim()}
              className="bg-purple-600 text-white text-sm px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
            >
              {bearbeiting ? "Bearbeitet…" : "Anwenden"}
            </button>
          </div>
          {bearbeitenMsg && <p className="text-sm mt-2 text-purple-700">{bearbeitenMsg}</p>}
        </div>
      )}
    </div>
  );
}

export default function DemosPage() {
  const [items, setItems] = useState<Betrieb[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "landing_generiert", limit: String(PAGE_SIZE), offset: String(offset) });
      const data = await apiFetch<BetriebeListe>(`/api/v1/betriebe?${params}`);
      setItems(data.items);
      setTotal(data.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [offset]);

  useEffect(() => { load(); }, [load]);

  const updateItem = (updated: Betrieb) => setItems((prev) => prev.map((b) => b.place_id === updated.place_id ? updated : b));

  const pages = Math.ceil(total / PAGE_SIZE);
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Demos</h1>
        <span className="text-sm text-gray-400">{total} Demos</span>
      </div>

      {loading && <p className="text-sm text-gray-400 py-8 text-center">Lädt…</p>}
      {!loading && items.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">Noch keine Demos generiert</p>}

      <div className="flex flex-col gap-3">
        {items.map((b) => <DemoCard key={b.place_id} b={b} onUpdate={updateItem} />)}
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
