import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Activity, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const SystemHealthBanner = () => {
  const [health, setHealth] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.getHealth();
        setHealth(res);
      } catch (err) {
        setHealth({ status: 'offline', services: {} });
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  if (!health) return null;

  const isHealthy = health.status === 'healthy';
  const services = health.services || {};

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-300">System Telemetry:</span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono ${
                isHealthy
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {health.status?.toUpperCase()}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              DB: {services.database?.status === 'connected' ? (
                <span className="text-emerald-400">connected</span>
              ) : (
                <span className="text-rose-400">offline</span>
              )}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              LLM: {services.llm?.status === 'available' ? (
                <span className="text-emerald-400">Ollama ({services.llm?.details?.model})</span>
              ) : (
                <span className="text-amber-400">Local Grounded Fallback</span>
              )}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Vector: <span className="text-cyan-400">{services.vectorIndex?.status}</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>{expanded ? 'Hide Details' : 'View Subsystems'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-3">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">API Server</div>
              <div className="text-slate-200 font-mono mt-0.5">{services.api?.status}</div>
              <div className="text-[10px] text-slate-400">Uptime: {services.api?.uptimeSeconds}s</div>
            </div>

            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Database (MongoDB)</div>
              <div className="text-slate-200 font-mono mt-0.5">{services.database?.status}</div>
              <div className="text-[10px] text-slate-400">{services.database?.details?.name || 'Local'}</div>
            </div>

            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">LLM Inference</div>
              <div className="text-slate-200 font-mono mt-0.5">{services.llm?.status}</div>
              <div className="text-[10px] text-slate-400 truncate">{services.llm?.details?.model}</div>
            </div>

            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Embedding Model</div>
              <div className="text-slate-200 font-mono mt-0.5">{services.embeddingModel?.status}</div>
              <div className="text-[10px] text-slate-400">{services.embeddingModel?.details?.dimension} dims</div>
            </div>

            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Vector Index</div>
              <div className="text-slate-200 font-mono mt-0.5">{services.vectorIndex?.status}</div>
              <div className="text-[10px] text-slate-400 truncate">{services.vectorIndex?.details?.indexName}</div>
            </div>

            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Email Service</div>
              <div className="text-slate-200 font-mono mt-0.5">{services.emailService?.status}</div>
              <div className="text-[10px] text-slate-400 truncate">{services.emailService?.from}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
