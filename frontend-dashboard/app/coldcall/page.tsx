"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  Betrieb, BetriebeListe, Kontaktversuch,
  LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, ALL_LEAD_STATUSES,
} from "@/types";

const LOAD_LIMIT = 500;

type StatusCounts = Partial<Record<string, number>>;

// Telefon-Normalisierung für Suche (entfernt Leerzeichen, +41, 0041 etc.)
function normTel(s: string) {
  return s.replace(/[\s\-().+]/g, "").toLowerCase();
}

function LeadCard({
  betrieb,
  onUpdate,
}: {
  betrieb: Betrieb;
  onUpdate: (b: Betrieb) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [leadStatus, setLeadStatus] = useState(betrieb.lead_status);
  const [notizen, setNotizen] = useState<Kontaktversuch[]>([]);
  const [notizText, setNotizText] = useState("");
  const [savingNotiz, setSavingNotiz] = useState(false);
  const [loadingNotizen, setLoadingNotizen] = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [demoMsg, setDemoMsg] = useState("");

  // Letzten sichtbaren Notiz-Vorschau aus vorgeladenem betrieb.kontaktversuche (falls vorhanden)
  const lastNote = useMemo(() => {
    const list = (betrieb.kontaktversuche || []).filter((k) => k.typ === "notiz" || k.typ === "anruf");
    return list[list.length - 1] ?? null;
  }, [betrieb.kontaktversuche]);

  const loadNotizen = useCallback(async () => {
    setLoadingNotizen(true);
    try {
      const b = await apiFetch<Betrieb>(`/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}`);
      const list = (b.kontaktversuche || []).filter((k) => k.typ === "notiz" || k.typ === "anruf");
      setNotizen(list);
    } catch { /* ignore */ }
    finally { setLoadingNotizen(false); }
  }, [betrieb.place_id]);

  useEffect(() => {
    if (expanded && notizen.length === 0) loadNotizen();
  }, [expanded, notizen.length, loadNotizen]);

  const changeStatus = async (newStatus: string) => {
    setLeadStatus(newStatus);
    try {
      const updated = await apiFetch<Betrieb>(
        `/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}`,
        { method: "PATCH", body: JSON.stringify({ lead_status: newStatus }) }
      );
      onUpdate(updated);
    } catch { setLeadStatus(betrieb.lead_status); }
  };

  const addNotiz = async () => {
    if (!notizText.trim()) return;
    setSavingNotiz(true);
    try {
      const neu = await apiFetch<Kontaktversuch>(
        `/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}/notiz`,
        { method: "POST", body: JSON.stringify({ text: notizText }) }
      );
      setNotizen((prev) => [...prev, neu]);
      setNotizText("");
    } catch { /* ignore */ }
    finally { setSavingNotiz(false); }
  };

  const generiereDemo = async () => {
    setGeneratingDemo(true);
    setDemoMsg("");
    try {
      await apiFetch(`/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}/demo/generieren`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setDemoMsg("Demo wird generiert…");
    } catch (e: unknown) {
      setDemoMsg((e as Error).message || "Fehler");
    } finally { setGeneratingDemo(false); }
  };

  const statusColor = LEAD_STATUS_COLORS[leadStatus] || "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Hauptzeile */}
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Expand-Toggle */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-1 text-gray-300 hover:text-gray-600 shrink-0"
          title="Notizen anzeigen"
        >
          <span className={`block transition-transform text-xs ${expanded ? "rotate-90" : ""}`}>▶</span>
        </button>

        {/* Name + Branche */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/betriebe/${betrieb.place_id}`}
              className="font-medium text-gray-900 hover:text-blue-600 text-sm"
            >
              {betrieb.name_anzeige || betrieb.name}
            </Link>
            {betrieb.branche && (
              <span className="text-xs text-gray-400">{betrieb.branche}</span>
            )}
          </div>

          {/* Letzte Notiz sichtbar */}
          {lastNote?.notizen && (
            <p className="text-xs text-gray-500 mt-0.5 truncate" title={lastNote.notizen}>
              <span className="text-gray-300 mr-1">
                {lastNote.gesendet_am ? new Date(lastNote.gesendet_am).toLocaleDateString("de-CH") : ""}
              </span>
              {lastNote.notizen}
            </p>
          )}
        </div>

        {/* Telefon */}
        <div className="shrink-0 text-sm font-mono">
          {betrieb.telefon ? (
            <a href={`tel:${betrieb.telefon}`} className="text-blue-600 hover:underline">
              {betrieb.telefon}
            </a>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <select
            value={leadStatus}
            onChange={(e) => changeStatus(e.target.value)}
            className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-300 ${statusColor}`}
          >
            {ALL_LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Demo */}
        <div className="shrink-0 text-xs">
          {betrieb.landing_url ? (
            <a
              href={betrieb.landing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Demo ↗
            </a>
          ) : betrieb.status === "extrahiert" ? (
            <div>
              <button
                onClick={generiereDemo}
                disabled={generatingDemo}
                className="text-purple-600 hover:underline disabled:opacity-40"
              >
                {generatingDemo ? "…" : "Demo erstellen"}
              </button>
              {demoMsg && <p className="text-gray-400 mt-0.5">{demoMsg}</p>}
            </div>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </div>
      </div>

      {/* Notizen-Bereich (expandierbar) */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          {loadingNotizen && <p className="text-xs text-gray-400 mb-2">Lädt…</p>}

          {!loadingNotizen && notizen.length === 0 && (
            <p className="text-xs text-gray-400 italic mb-2">Noch keine Notizen.</p>
          )}

          <div className="flex flex-col gap-1 mb-3">
            {notizen.map((k) => (
              <div key={k.id} className="flex gap-3 text-sm">
                <span className="text-xs text-gray-400 whitespace-nowrap w-32 shrink-0 mt-0.5">
                  {k.gesendet_am ? new Date(k.gesendet_am).toLocaleString("de-CH") : "—"}
                </span>
                <p className="text-gray-700">{k.notizen}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 items-start">
            <textarea
              value={notizText}
              onChange={(e) => setNotizText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNotiz(); }}
              rows={2}
              placeholder="Notiz… (⌘+Enter)"
              className="flex-1 border border-gray-200 rounded px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            <button
              onClick={addNotiz}
              disabled={savingNotiz || !notizText.trim()}
              className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded hover:bg-gray-900 disabled:opacity-40"
            >
              {savingNotiz ? "…" : "Speichern"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ColdCallPage() {
  const [items, setItems] = useState<Betrieb[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<StatusCounts>({});
  const [search, setSearch] = useState("");

  const loadCounts = useCallback(async () => {
    const results = await Promise.allSettled(
      ALL_LEAD_STATUSES.map((s) =>
        apiFetch<BetriebeListe>(`/api/v1/betriebe?lead_status=${s}&limit=1`).then((d) => ({
          status: s, count: d.total,
        }))
      )
    );
    const c: StatusCounts = {};
    for (const r of results) {
      if (r.status === "fulfilled") c[r.value.status] = r.value.count;
    }
    setCounts(c);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab) params.set("lead_status", activeTab);
      params.set("limit", String(LOAD_LIMIT));
      const data = await apiFetch<BetriebeListe>(`/api/v1/betriebe?${params}`);
      setItems(data.items);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { loadCounts(); }, [loadCounts]);
  useEffect(() => { load(); }, [load]);

  const updateItem = (updated: Betrieb) => {
    setItems((prev) => prev.map((b) => (b.place_id === updated.place_id ? updated : b)));
    loadCounts();
  };

  // Telefon-Suche client-seitig
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = normTel(search);
    return items.filter((b) => b.telefon && normTel(b.telefon).includes(q));
  }, [items, search]);

  const totalCount = Object.values(counts).reduce((a, b) => (a || 0) + (b || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Cold Calling</h1>

      {/* Status-Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveTab("")}
          className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
            activeTab === ""
              ? "bg-gray-800 text-white border-gray-800"
              : "border-gray-200 text-gray-600 hover:border-gray-400"
          }`}
        >
          Alle <span className="ml-1 opacity-60">{totalCount}</span>
        </button>
        {ALL_LEAD_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setActiveTab(s)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
              activeTab === s
                ? `${LEAD_STATUS_COLORS[s]} border-transparent font-semibold`
                : "border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {LEAD_STATUS_LABELS[s]}
            {counts[s] != null && <span className="ml-1 opacity-60">{counts[s]}</span>}
          </button>
        ))}
      </div>

      {/* Telefon-Suche */}
      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Telefonnummer suchen…"
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        {search && (
          <span className="ml-3 text-sm text-gray-400">{filtered.length} Treffer</span>
        )}
      </div>

      {/* Lead-Karten */}
      {loading && <p className="text-sm text-gray-400 py-8 text-center">Lädt…</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">Keine Leads</p>
      )}
      <div className="flex flex-col gap-2">
        {filtered.map((b) => (
          <LeadCard key={b.place_id} betrieb={b} onUpdate={updateItem} />
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        {filtered.length} von {items.length} Leads angezeigt
      </p>
    </div>
  );
}
