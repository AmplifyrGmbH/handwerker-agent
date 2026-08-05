"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  Betrieb, BetriebeListe, Kontaktversuch,
  LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, ALL_LEAD_STATUSES,
} from "@/types";

const PAGE_SIZE = 100;

type StatusCounts = Partial<Record<string, number>>;

function StatusBadge({ status }: { status: string }) {
  const color = LEAD_STATUS_COLORS[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>
      {LEAD_STATUS_LABELS[status] || status}
    </span>
  );
}

function NotizEintrag({ k }: { k: Kontaktversuch }) {
  const zeit = k.gesendet_am ? new Date(k.gesendet_am).toLocaleString("de-CH") : "—";
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5 w-36 shrink-0">{zeit}</span>
      <p className="text-sm text-gray-700">{k.notizen}</p>
    </div>
  );
}

function LeadRow({ betrieb, onUpdate }: { betrieb: Betrieb; onUpdate: (b: Betrieb) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [leadStatus, setLeadStatus] = useState(betrieb.lead_status);
  const [notizen, setNotizen] = useState<Kontaktversuch[]>([]);
  const [notizText, setNotizText] = useState("");
  const [savingNotiz, setSavingNotiz] = useState(false);
  const [loadingNotizen, setLoadingNotizen] = useState(false);

  const loadNotizen = useCallback(async () => {
    if (!expanded) return;
    setLoadingNotizen(true);
    try {
      const b = await apiFetch<Betrieb & { kontaktversuche: Kontaktversuch[] }>(
        `/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}`
      );
      setNotizen((b.kontaktversuche || []).filter((k) => k.typ === "notiz" || k.typ === "anruf"));
    } catch {
      /* ignore */
    } finally {
      setLoadingNotizen(false);
    }
  }, [expanded, betrieb.place_id]);

  useEffect(() => {
    loadNotizen();
  }, [loadNotizen]);

  const changeStatus = async (newStatus: string) => {
    setLeadStatus(newStatus);
    try {
      const updated = await apiFetch<Betrieb>(
        `/api/v1/betriebe/${encodeURIComponent(betrieb.place_id)}`,
        { method: "PATCH", body: JSON.stringify({ lead_status: newStatus }) }
      );
      onUpdate(updated);
    } catch {
      setLeadStatus(betrieb.lead_status);
    }
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
    } catch {
      /* ignore */
    } finally {
      setSavingNotiz(false);
    }
  };

  const color = LEAD_STATUS_COLORS[leadStatus] || "bg-gray-100 text-gray-600";

  return (
    <>
      <tr
        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${expanded ? "bg-blue-50 hover:bg-blue-50" : ""}`}
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          <div className="flex items-center gap-2">
            <span className={`text-xs transition-transform ${expanded ? "rotate-90" : ""}`}>▶</span>
            {betrieb.name_anzeige || betrieb.name}
          </div>
          {betrieb.branche && <div className="text-xs text-gray-400 ml-5">{betrieb.branche}</div>}
        </td>
        <td className="px-4 py-3 text-sm font-mono text-gray-700">
          {betrieb.telefon ? (
            <a
              href={`tel:${betrieb.telefon}`}
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {betrieb.telefon}
            </a>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <select
            value={leadStatus}
            onChange={(e) => changeStatus(e.target.value)}
            className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-300 ${color}`}
          >
            {ALL_LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {betrieb.letzter_kontakt_am
            ? new Date(betrieb.letzter_kontakt_am).toLocaleString("de-CH")
            : "—"}
        </td>
        <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
          {betrieb.landing_url ? (
            <a
              href={betrieb.landing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-xs"
            >
              Demo ↗
            </a>
          ) : (
            <Link
              href={`/betriebe/${betrieb.place_id}`}
              className="text-xs text-gray-400 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Details
            </Link>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-blue-50 border-b border-gray-200">
          <td colSpan={5} className="px-6 py-4">
            <div className="max-w-2xl">
              {/* Notizen-Liste */}
              <div className="mb-3">
                {loadingNotizen && <p className="text-xs text-gray-400">Lädt...</p>}
                {!loadingNotizen && notizen.length === 0 && (
                  <p className="text-xs text-gray-400 italic">Noch keine Notizen.</p>
                )}
                {notizen.map((k) => <NotizEintrag key={k.id} k={k} />)}
              </div>

              {/* Neue Notiz */}
              <div className="flex gap-2 items-start">
                <textarea
                  value={notizText}
                  onChange={(e) => setNotizText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNotiz();
                  }}
                  rows={2}
                  placeholder="Notiz eingeben… (⌘+Enter zum Speichern)"
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  onClick={addNotiz}
                  disabled={savingNotiz || !notizText.trim()}
                  className="bg-gray-800 text-white text-sm px-3 py-2 rounded hover:bg-gray-900 disabled:opacity-40 whitespace-nowrap"
                >
                  {savingNotiz ? "…" : "Speichern"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ColdCallPage() {
  const [items, setItems] = useState<Betrieb[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<StatusCounts>({});

  const loadCounts = useCallback(async () => {
    const results = await Promise.allSettled(
      ALL_LEAD_STATUSES.map((s) =>
        apiFetch<BetriebeListe>(`/api/v1/betriebe?lead_status=${s}&limit=1`).then((d) => ({
          status: s,
          count: d.total,
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
      params.set("limit", String(PAGE_SIZE));
      const data = await apiFetch<BetriebeListe>(`/api/v1/betriebe?${params}`);
      setItems(data.items);
      setTotal(data.total);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    load();
  }, [load]);

  const updateItem = (updated: Betrieb) => {
    setItems((prev) => prev.map((b) => (b.place_id === updated.place_id ? updated : b)));
    loadCounts();
  };

  const totalCount = Object.values(counts).reduce((a, b) => (a || 0) + (b || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Cold Calling</h1>

      {/* Status-Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
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
            {counts[s] != null && (
              <span className="ml-1 opacity-60">{counts[s]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tabelle */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="px-4 py-3">Firma</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Lead-Status</th>
                <th className="px-4 py-3">Letzter Kontakt</th>
                <th className="px-4 py-3">Demo</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Lädt...</td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Keine Leads</td>
                </tr>
              )}
              {items.map((b) => (
                <LeadRow key={b.place_id} betrieb={b} onUpdate={updateItem} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          {total} Leads {total > PAGE_SIZE && `(erste ${PAGE_SIZE} angezeigt)`}
        </div>
      </div>
    </div>
  );
}
