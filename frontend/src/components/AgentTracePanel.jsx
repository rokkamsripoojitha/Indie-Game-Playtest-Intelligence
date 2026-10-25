import React from 'react';
import { Terminal, CheckCircle2, AlertCircle, Clock, Database, Layers, Hash } from 'lucide-react';

export const AgentTracePanel = ({ traces = [], totalMs = 0 }) => {
  if (!traces || traces.length === 0) return null;

  const getToolIcon = (toolName) => {
    switch (toolName) {
      case 'findFeedback':
        return <Layers className="w-4 h-4 text-cyan-400" />;
      case 'readIssueState':
        return <Database className="w-4 h-4 text-amber-400" />;
      case 'countAffectedSessions':
        return <Hash className="w-4 h-4 text-purple-400" />;
      default:
        return <Terminal className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl my-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-200 text-sm tracking-wide">
            Backend AI Agent Orchestration Trace
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Execution time: {totalMs}ms</span>
        </div>
      </div>

      <div className="space-y-3">
        {traces.map((step, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs"
          >
            <div className="mt-0.5">{getToolIcon(step.tool)}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-semibold text-slate-200">
                  Step {idx + 1}: {step.tool}()
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  {step.status === 'success' ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> success ({step.executionMs}ms)
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> failed ({step.executionMs}ms)
                    </span>
                  )}
                </span>
              </div>
              <p className="text-slate-400 mb-1.5">{step.summary}</p>
              {step.inputs && (
                <div className="font-mono text-[11px] text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800/60">
                  Input: {JSON.stringify(step.inputs)}
                </div>
              )}
              {step.error && (
                <div className="font-mono text-[11px] text-rose-300 bg-rose-950/40 px-2 py-1 rounded border border-rose-900 mt-1">
                  Error: {step.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
