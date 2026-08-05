"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  Betrieb, BetriebeListe, Kontaktversuch,
  LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, ALL_LEAD_STATUSES,
  AGENTS,
} from "@/types";

const LOAD_LIMIT = 500;

// Normalisiert Telefonnummern für Vergleich:
// +41 44 / 044 / 0041 44 werden alle gleich behandelt
function normTel(s: string): string {
  const digits = s.replace(/\D/g, "");
  if (digits.startsWith("0041")) return "41" + digits.slice(4);
  if (digits.startsWith("0")) return "41" + digits.slice(1);
  return digits;
}

type QuickFilter =
  | { type: "alle" }
  | { type: "lead_status"; value: string }
  | { type: "agent"; value: string };

function filterLabel(f: QuickFilter): string {
  if (f.type === "alle") return "Alle";
  if (f.type === "lead_status") return LEAD_STATUS_LABELS[f.value] || f.value;
  return f.value;
}

// Activity-Feed-Eintrag
type Activity = {
  ts: Date;
  type: "system" | "notiz" | "anruf" | "demo" | "email";
  label: string;
  detail?: string;
};

function buildActivities(b: Betrieb, kvs: Kontaktversuch[]): Activity[] {
  const list: Activity[] = [];
  if (b.entdeckt_am)
    list.push({ ts: new Date(b.entdeckt_am), type: "system", label: "Lead erstellt" });
  if (b.extrahiert_am)
    list.push({ ts: new Date(b.extrahiert_am), type: "system", label: "Extrahiert" });
  if (b.landing_generiert_am)
    list.push({ ts: new Date(b.landing_generiert_am), type: "demo", label: "Demo generiert" });
  for (const k of kvs) {
    if (!k.gesendet_am) continue;
    const ts = new Date(k.gesendet_am);
    if (k.typ === "notiz")
      list.push({ ts, type: "notiz", label: "Notiz", detail: k.notizen || "" });
    else if (k.typ === "anruf")
      list.push({ ts, type: "anruf", label: "Anruf", detail: k.notizen || "" });
    else if (k.typ === "email_demo")
      list.push({ ts, type: "email", label: "Demo gesendet", detail: k.email_adresse || "" });
  }
  return list.sort((a, b) => a.ts.getTime() - b.ts.getTime());
}

const ACTIVITY_DOT: Record<string, string> = {
  system: "bg-gray-300",
  notiz: "bg-blue-400",
  anruf: "bg-orange-400",
  demo: "bg-purple-400",
  email: "bg-green-400",
};

function LeadCard({
  betrieb,
  onUpdate,
  isExpanded,
  onToggle,
}: {
  betrieb: Betrieb;
  onUpdate: (b: Betrieb) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [leadStatus, setLeadStatus] = useState(betrieb.lead_status);
  const [agent, setAgent] = useState(betrieb.agent || "");
  const [kvs, setKvs] = useState<Kontaktversuch[]>([]);
  const [notizText, setNotizText] = useState("");
  const [savingNotiz, setSavingNotiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [demoMsg, setDemoMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const b = await apiFetch<Betrieb>(`/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}`);
      setKvs(b.kontaktversuche || []);
      setLoaded(true);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [betrieb.place_id]);

  useEffect(() => {
    if (isExpanded && !loaded) loadDetail();
  }, [isExpanded, loaded, loadDetail]);

  // Aufklappen + Textarea fokussieren
  const openAndFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) onToggle();
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const patch = async (data: object) => {
    try {
      const updated = await apiFetch<Betrieb>(
        `/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}`,
        { method: "PATCH", body: JSON.stringify(data) }
      );
      onUpdate(updated);
      return updated;
    } catch { return null; }
  };

  const changeStatus = async (newStatus: string) => {
    setLeadStatus(newStatus);
    if (!await patch({ lead_status: newStatus })) setLeadStatus(betrieb.lead_status);
  };

  const changeAgent = async (newAgent: string) => {
    setAgent(newAgent);
    if (!await patch({ agent: newAgent || null })) setAgent(betrieb.agent || "");
  };

  const addNotiz = async () => {
    if (!notizText.trim()) return;
    setSavingNotiz(true);
    try {
      const neu = await apiFetch<Kontaktversuch>(
        `/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}/notiz`,
        { method: "POST", body: JSON.stringify({ text: notizText }) }
      );
      setKvs((prev) => [...prev, neu]);
      onUpdate({ ...betrieb, letzte_notiz: notizText, letzte_notiz_am: neu.gesendet_am });
      setNotizText("");
    } catch { /* ignore */ }
    finally { setSavingNotiz(false); }
  };

  const generiereDemo = async () => {
    setGeneratingDemo(true);
    setDemoMsg("");
    try {
      await apiFetch(`/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}/demo/generieren`, {
        method: "POST", body: JSON.stringify({}),
      });
      setDemoMsg("Wird generiert…");
    } catch (e: unknown) {
      setDemoMsg((e as Error).message || "Fehler");
    } finally { setGeneratingDemo(false); }
  };

  const statusColor = LEAD_STATUS_COLORS[leadStatus] || "bg-gray-100 text-gray-600";
  const letzteNotiz = betrieb.letzte_notiz;
  const letzteNotizAm = betrieb.letzte_notiz_am
    ? new Date(betrieb.letzte_notiz_am).toLocaleDateString("de-CH")
    : null;
  const activities = loaded ? buildActivities(betrieb, kvs) : [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Hauptzeile — klickbar zum Aufklappen */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Expand-Indikator */}
        <span className={`text-gray-300 shrink-0 block transition-transform text-xs ${isExpanded ? "rotate-90" : ""}`}>▶</span>

        {/* Name + Telefon */}
        <div className="shrink-0 w-64">
          <Link
            href={`/betriebe/${betrieb.place_id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-gray-900 hover:text-blue-600 text-sm leading-tight block"
          >
            {betrieb.name_anzeige || betrieb.name}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            {betrieb.branche && <span className="text-xs text-gray-400">{betrieb.branche}</span>}
            {betrieb.telefon ? (
              <a href={`tel:${betrieb.telefon}`} onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 hover:underline font-mono">
                {betrieb.telefon}
              </a>
            ) : (
              <span className="text-xs text-gray-300">Keine Nummer</span>
            )}
          </div>
        </div>

        {/* Letzte Notiz — klickbar wenn leer */}
        <div className="flex-1 min-w-0">
          {letzteNotiz ? (
            <p className="text-xs text-gray-500 line-clamp-1" title={letzteNotiz}>
              {letzteNotizAm && <span className="text-gray-300 mr-1">{letzteNotizAm}</span>}
              {letzteNotiz}
            </p>
          ) : (
            <button
              onClick={openAndFocus}
              className="text-xs text-gray-300 italic hover:text-gray-400 hover:underline"
            >
              Keine Notizen
            </button>
          )}

        </div>

        {/* Agent */}
        <select
          value={agent}
          onChange={(e) => { e.stopPropagation(); changeAgent(e.target.value); }}
          onClick={(e) => e.stopPropagation()}
          className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 shrink-0"
        >
          <option value="">— Kein Agent</option>
          {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Status */}
        <select
          value={leadStatus}
          onChange={(e) => { e.stopPropagation(); changeStatus(e.target.value); }}
          onClick={(e) => e.stopPropagation()}
          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-300 shrink-0 ${statusColor}`}
        >
          {ALL_LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
          ))}
        </select>

        {/* Demo */}
        {betrieb.status === "extrahiert" && !betrieb.landing_url && (
          <div className="shrink-0 text-xs" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={generiereDemo}
              disabled={generatingDemo}
              className="text-purple-600 hover:underline disabled:opacity-40"
            >
              {generatingDemo ? "…" : "Demo erstellen"}
            </button>
            {demoMsg && <p className="text-gray-400 mt-0.5">{demoMsg}</p>}
          </div>
        )}
      </div>

      {/* Activity-Feed + Notiz-Eingabe */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          {loading && <p className="text-xs text-gray-400 mb-3">Lädt…</p>}

          {/* Timeline */}
          {activities.length > 0 && (
            <div className="mb-4 flex flex-col gap-0">
              {activities.map((a, i) => (
                <div key={i} className="flex gap-3 items-start">
                  {/* Linie + Punkt */}
                  <div className="flex flex-col items-center shrink-0 w-3 pt-1.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${ACTIVITY_DOT[a.type]}`} />
                    {i < activities.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 mt-1 mb-0" style={{ minHeight: "16px" }} />
                    )}
                  </div>
                  {/* Inhalt */}
                  <div className="pb-3 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {a.ts.toLocaleString("de-CH")}
                      </span>
                      <span className="text-xs font-medium text-gray-600">{a.label}</span>
                    </div>
                    {a.detail && (
                      <p className="text-sm text-gray-700 mt-0.5">{a.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notiz-Eingabe */}
          <div className="flex gap-2 items-start">
            <textarea
              ref={textareaRef}
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
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<QuickFilter>({ type: "alle" });
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Quick-Filter-Optionen
  const quickFilters: QuickFilter[] = [
    { type: "alle" },
    { type: "lead_status", value: "nicht_angerufen" },
    ...AGENTS.map((a): QuickFilter => ({ type: "agent", value: a })),
  ];

  const loadCounts = useCallback(async () => {
    const results = await Promise.allSettled([
      apiFetch<BetriebeListe>("/api/v1/betriebe?limit=1").then((d) => ({ key: "alle", count: d.total })),
      apiFetch<BetriebeListe>("/api/v1/betriebe?lead_status=nicht_angerufen&limit=1").then((d) => ({ key: "nicht_angerufen", count: d.total })),
      ...AGENTS.map((a) =>
        apiFetch<BetriebeListe>(`/api/v1/betriebe?agent=${a}&limit=1`).then((d) => ({ key: a, count: d.total }))
      ),
    ]);
    const c: Record<string, number> = {};
    for (const r of results) {
      if (r.status === "fulfilled") c[r.value.key] = r.value.count;
    }
    setCounts(c);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LOAD_LIMIT) });
      if (activeFilter.type === "lead_status") params.set("lead_status", activeFilter.value);
      if (activeFilter.type === "agent") params.set("agent", activeFilter.value);
      const data = await apiFetch<BetriebeListe>(`/api/v1/betriebe?${params}`);
      setItems(data.items);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [activeFilter]);

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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-5">Cold Calling</h1>

      {/* Quick-Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickFilters.map((f, i) => {
          const key = f.type === "alle" ? "alle" : f.type === "lead_status" ? f.value : f.value;
          const isActive =
            f.type === activeFilter.type &&
            (f.type === "alle" || (f as { value: string }).value === (activeFilter as { value: string }).value);
          const count = counts[key];
          return (
            <button
              key={i}
              onClick={() => setActiveFilter(f)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                isActive
                  ? "bg-gray-800 text-white border-gray-800 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {filterLabel(f)}
              {count != null && <span className="ml-1.5 opacity-60 text-xs">{count}</span>}
            </button>
          );
        })}
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
          <LeadCard
            key={b.place_id}
            betrieb={b}
            onUpdate={updateItem}
            isExpanded={expandedId === b.place_id}
            onToggle={() => setExpandedId((prev) => prev === b.place_id ? null : b.place_id)}
          />
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        {filtered.length} von {items.length} Leads
      </p>
    </div>
  );
}
