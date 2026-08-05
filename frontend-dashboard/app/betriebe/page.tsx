"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Betrieb, BetriebeListe, BRANCHEN, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, ALL_LEAD_STATUSES } from "@/types";

const PAGE_SIZE = 50;

export default function BetriebePage() {
  const [items, setItems] = useState<Betrieb[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filterLeadStatus, setFilterLeadStatus] = useState("");
  const [filterBranche, setFilterBranche] = useState("");
  const [filterKanton, setFilterKanton] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterLeadStatus) params.set("lead_status", filterLeadStatus);
      if (filterBranche) params.set("branche", filterBranche);
      if (filterKanton) params.set("kanton", filterKanton);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));
      const data = await apiFetch<BetriebeListe>(`/api/v1/betriebe?${params}`);
      setItems(data.items);
      setTotal(data.total);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [filterLeadStatus, filterBranche, filterKanton, offset]);

  useEffect(() => {
    setOffset(0);
  }, [filterLeadStatus, filterBranche, filterKanton]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = Math.ceil(total / PAGE_SIZE);
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Leads</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterLeadStatus}
          onChange={(e) => setFilterLeadStatus(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm"
        >
          <option value="">Alle Lead-Status</option>
          {ALL_LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filterBranche}
          onChange={(e) => setFilterBranche(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm"
        >
          <option value="">Alle Branchen</option>
          {BRANCHEN.map((b) => <option key={b}>{b}</option>)}
        </select>
        <input
          type="text"
          value={filterKanton}
          onChange={(e) => setFilterKanton(e.target.value)}
          placeholder="Kanton"
          className="border border-gray-200 rounded px-3 py-2 text-sm w-32"
        />
        <span className="text-sm text-gray-400 self-center">{total} Betriebe</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="px-4 py-3">Firmenname</th>
                <th className="px-4 py-3">Branche</th>
                <th className="px-4 py-3">Ort</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Lead-Status</th>
                <th className="px-4 py-3">Demo</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Lädt...</td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Keine Einträge</td>
                </tr>
              )}
              {items.map((b) => {
                const leadColor = LEAD_STATUS_COLORS[b.lead_status] || "bg-gray-100 text-gray-600";
                return (
                  <tr key={b.place_id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/betriebe/${b.place_id}`} className="text-blue-600 hover:underline font-medium">
                        {b.name_anzeige || b.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.branche || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.ort || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {b.telefon || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${leadColor}`}>
                        {LEAD_STATUS_LABELS[b.lead_status] || b.lead_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {b.landing_url ? (
                        <a
                          href={b.landing_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Demo ansehen
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
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
    </div>
  );
}
