"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch, wsUrl } from "@/lib/api";
import { Job, BRANCHEN } from "@/types";

const STATUS_COLORS = {
  laufend: "bg-yellow-100 text-yellow-800",
  abgeschlossen: "bg-green-100 text-green-800",
  fehler: "bg-red-100 text-red-800",
};

function JobRow({ job, onSelect }: { job: Job; onSelect: (j: Job) => void }) {
  const color = STATUS_COLORS[job.status] || "bg-gray-100 text-gray-700";
  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
      onClick={() => onSelect(job)}
    >
      <td className="px-4 py-3 text-sm font-mono text-gray-500">#{job.id}</td>
      <td className="px-4 py-3 text-sm">{job.typ}</td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>{job.status}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {job.total != null ? `${job.verarbeitet}/${job.total}` : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-red-500">{job.fehler > 0 ? job.fehler : "—"}</td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {job.gestartet_am ? new Date(job.gestartet_am).toLocaleString("de-CH") : "—"}
      </td>
    </tr>
  );
}

function JobDetail({ job, onClose }: { job: Job; onClose: () => void }) {
  const [liveJob, setLiveJob] = useState<Job>(job);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (job.status === "laufend") {
      const ws = new WebSocket(wsUrl(`/api/v1/pipeline/ws/jobs/${job.id}`));
      wsRef.current = ws;
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setLiveJob(data);
      };
      return () => ws.close();
    } else {
      setLiveJob(job);
    }
  }, [job]);

  const color = STATUS_COLORS[liveJob.status] || "bg-gray-100 text-gray-700";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Job #{liveJob.id} — {liveJob.typ}</span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>{liveJob.status}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
        </div>
        <div className="px-6 py-3 flex gap-6 text-sm text-gray-600 border-b border-gray-100">
          <span>Verarbeitet: <strong>{liveJob.verarbeitet}</strong>{liveJob.total != null && `/${liveJob.total}`}</span>
          <span>Fehler: <strong className={liveJob.fehler > 0 ? "text-red-500" : ""}>{liveJob.fehler}</strong></span>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded p-3 min-h-32">
            {liveJob.log || "Kein Log vorhanden."}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [branche, setBranche] = useState("Maler");
  const [kanton, setKanton] = useState("");
  const [maxPerSearch, setMaxPerSearch] = useState(100);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadJobs = async () => {
    try {
      const data = await apiFetch<Job[]>("/api/v1/pipeline/jobs");
      setJobs(data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const startJob = async (endpoint: string, body: object) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ job_id: number; message: string }>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      await loadJobs();
      // Open the new job automatically
      const job = await apiFetch<Job>(`/api/v1/pipeline/jobs/${res.job_id}`);
      setSelectedJob(job);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const discoveryBody = { branche, kanton, max_per_search: maxPerSearch };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Pipeline</h1>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="font-semibold mb-4">Neuen Job starten</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Branche</label>
            <select
              value={branche}
              onChange={(e) => setBranche(e.target.value)}
              className="border border-gray-200 rounded px-3 py-2 text-sm"
            >
              {BRANCHEN.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Kanton (leer = alle)</label>
            <input
              type="text"
              value={kanton}
              onChange={(e) => setKanton(e.target.value)}
              placeholder="z.B. Zürich"
              className="border border-gray-200 rounded px-3 py-2 text-sm w-36"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Max. Ergebnisse</label>
            <input
              type="number"
              value={maxPerSearch}
              onChange={(e) => setMaxPerSearch(Number(e.target.value))}
              min={1}
              max={500}
              className="border border-gray-200 rounded px-3 py-2 text-sm w-24"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            disabled={loading}
            onClick={() => startJob("/api/v1/pipeline/discovery/start", discoveryBody)}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Discovery
          </button>
          <button
            disabled={loading}
            onClick={() => startJob("/api/v1/pipeline/extraktion/start", {})}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Extraktion
          </button>
          <button
            disabled={loading}
            onClick={() => startJob("/api/v1/pipeline/landing/start", {})}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Landing Pages
          </button>
          <button
            disabled={loading}
            onClick={() => startJob("/api/v1/pipeline/outreach/start", {})}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Outreach
          </button>
          <button
            disabled={loading}
            onClick={() => startJob("/api/v1/pipeline/full/start", discoveryBody)}
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded hover:bg-black disabled:opacity-50"
          >
            Alles starten
          </button>
        </div>
      </div>

      {/* Job list */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold">Letzte Jobs</h2>
          <button onClick={loadJobs} className="text-sm text-blue-600 hover:underline">Aktualisieren</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Typ</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Fortschritt</th>
                <th className="px-4 py-2">Fehler</th>
                <th className="px-4 py-2">Gestartet</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Keine Jobs vorhanden</td>
                </tr>
              )}
              {jobs.map((j) => (
                <JobRow key={j.id} job={j} onSelect={setSelectedJob} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedJob && (
        <JobDetail job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
}
