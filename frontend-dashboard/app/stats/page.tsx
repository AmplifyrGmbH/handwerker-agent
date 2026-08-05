"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, ALL_LEAD_STATUSES } from "@/types";

interface Stats {
  total: number;
  demos: number;
  verkauft: number;
  nach_status: Record<string, number>;
  nach_agent: Record<string, number>;
  nach_branche: Record<string, number>;
  aktivitaet_14d: Record<string, number>;
}

function Bar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-gray-700 w-8 text-right font-mono">{value}</span>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// Letzte 14 Tage als Datumsstring-Array erzeugen
function last14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Stats>("/api/v1/stats/coldcall")
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-8 text-gray-400">Lädt…</div>;
  if (!stats) return <div className="max-w-5xl mx-auto px-6 py-8 text-red-500">Fehler beim Laden</div>;

  const angerufen = stats.total - (stats.nach_status["nicht_angerufen"] || 0);
  const angerufenPct = stats.total > 0 ? Math.round((angerufen / stats.total) * 100) : 0;
  const maxStatus = Math.max(...ALL_LEAD_STATUSES.map((s) => stats.nach_status[s] || 0), 1);
  const maxBranche = Math.max(...Object.values(stats.nach_branche), 1);
  const maxAgent = Math.max(...Object.values(stats.nach_agent), 1);

  const days = last14Days();
  const maxDay = Math.max(...days.map((d) => stats.aktivitaet_14d[d] || 0), 1);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Statistik</h1>

      {/* KPI-Karten */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <KpiCard label="Leads gesamt" value={stats.total} />
        <KpiCard
          label="Angerufen"
          value={angerufen}
          sub={`${angerufenPct}% des Totals`}
        />
        <KpiCard label="Demos generiert" value={stats.demos} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Status-Verteilung */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-4">Lead-Status</h2>
          <div className="flex flex-col gap-3">
            {ALL_LEAD_STATUSES.map((s) => {
              const count = stats.nach_status[s] || 0;
              const dotColor = LEAD_STATUS_COLORS[s]?.split(" ")[0] || "bg-gray-200";
              return (
                <div key={s}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span className="text-sm text-gray-700">{LEAD_STATUS_LABELS[s]}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <Bar value={count} max={maxStatus} color="bg-blue-400" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Nach Agent */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-4">Nach Agent</h2>
          {Object.keys(stats.nach_agent).length === 0 ? (
            <p className="text-sm text-gray-400 italic">Noch keine Zuteilungen</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(stats.nach_agent)
                .sort((a, b) => b[1] - a[1])
                .map(([agent, count]) => (
                  <div key={agent}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 font-medium">{agent}</span>
                      <span className="text-xs text-gray-400">
                        {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                      </span>
                    </div>
                    <Bar value={count} max={maxAgent} color="bg-indigo-400" />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Aktivität letzte 14 Tage */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-4">
          Aktivität letzte 14 Tage (Notizen + Anrufe)
        </h2>
        <div className="flex items-end gap-1 h-24">
          {days.map((d) => {
            const count = stats.aktivitaet_14d[d] || 0;
            const pct = maxDay > 0 ? (count / maxDay) * 100 : 0;
            const label = new Date(d + "T00:00:00").toLocaleDateString("de-CH", { day: "numeric", month: "numeric" });
            return (
              <div key={d} className="flex-1 flex flex-col items-center gap-1" title={`${label}: ${count}`}>
                <span className="text-xs text-gray-400 leading-none">{count > 0 ? count : ""}</span>
                <div className="w-full flex items-end" style={{ height: "64px" }}>
                  <div
                    className="w-full rounded-t bg-blue-400 transition-all"
                    style={{ height: `${pct}%`, minHeight: count > 0 ? "4px" : "0" }}
                  />
                </div>
                <span className="text-[10px] text-gray-300 leading-none">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nach Branche */}
      {Object.keys(stats.nach_branche).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-4">Nach Branche</h2>
          <div className="flex flex-col gap-3">
            {Object.entries(stats.nach_branche).map(([branche, count]) => (
              <div key={branche}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{branche}</span>
                  <span className="text-xs text-gray-400">{count}</span>
                </div>
                <Bar value={count} max={maxBranche} color="bg-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
