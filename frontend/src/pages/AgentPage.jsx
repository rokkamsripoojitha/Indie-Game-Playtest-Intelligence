import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { AgentTracePanel } from '../components/AgentTracePanel';
import { StatusBadge } from '../components/StatusBadge';
import {
  Bot,
  Sparkles,
  Layers,
  Database,
  Hash,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Play
} from 'lucide-react';

export const AgentPage = () => {
  const { activeStudio, builds, isDeveloper } = useStudio();
  const [buildId, setBuildId] = useState(builds[0]?._id || '');
  const [topic, setTopic] = useState('Tutorial Inventory');
  const [loading, setLoading] = useState(false);
  const [agentResult, setAgentResult] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState('');
  const [error, setError] = useState('');

  // Sync if builds load late
  React.useEffect(() => {
    if (!buildId && builds.length > 0) setBuildId(builds[0]._id);
  }, [builds]);

  const handleRunInvestigation = async (e) => {
    e?.preventDefault();
    if (!buildId || !activeStudio?._id) return;

    setLoading(true);
    setError('');
    setApprovalSuccess('');
    setAgentResult(null);

    try {
      const res = await api.investigateTopic({
        studioId: activeStudio._id,
        buildId,
        topic
      });
      setAgentResult(res);
    } catch (err) {
      setError(err.message || 'Investigation agent execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProposal = async () => {
    if (!agentResult || !agentResult.cluster) return;

    setApprovalLoading(true);
    setError('');
    setApprovalSuccess('');

    try {
      const reportIds = agentResult.cluster.reports.map(r => r._id);
      const res = await api.approveProposalIssue({
        studioId: activeStudio._id,
        buildId,
        title: agentResult.investigationTitle,
        description: `Identified by AI Agent Pre-Playtest Investigation.\n\n[Known Facts]:\n${agentResult.evidence?.knownFacts?.join('\n')}\n\n[Hypotheses]:\n${agentResult.evidence?.hypotheses?.join('\n')}\n\n[Missing Reproduction Details]:\n${agentResult.evidence?.missingReproductionDetails}`,
        severity: 'high',
        evidenceReportIds: reportIds,
        suggestedFollowUpTest: agentResult.evidence?.suggestedFollowUpTest
      });

      setApprovalSuccess(res.message);
    } catch (err) {
      setError(err.message || 'Failed to approve proposal and create issue.');
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-mono uppercase text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
            Capstone Core AI Feature
          </span>
          <span className="text-xs text-slate-400 font-mono">Sequence: findFeedback &rarr; readIssueState &rarr; countAffectedSessions</span>
        </div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-purple-400" />
          <span>Pre-Playtest AI Investigation Agent</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Asks: <strong>"What should we investigate before the next playtest?"</strong> Runs backend orchestration tools to cluster observations, inspect confirmed issue states, and count distinct affected cohorts.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {approvalSuccess && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-900 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <strong>Developer Action Recorded: </strong>
            <span>{approvalSuccess}</span>
          </div>
        </div>
      )}

      {/* Agent Launch Control Panel */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Investigation Target Parameters</span>
        </h2>

        <form onSubmit={handleRunInvestigation} className="grid sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Target Build *</label>
            <select
              value={buildId}
              onChange={(e) => setBuildId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              {builds.map(b => (
                <option key={b._id} value={b._id}>
                  {b.version} ({b.buildName})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-300 mb-1">Topic / Scope of Investigation *</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Tutorial Inventory, Graphics Crash, Combat Stutter"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loading ? 'Orchestrating...' : 'Run Investigation'}</span>
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400 flex-wrap">
          <span className="text-slate-500">Quick Test Prompts:</span>
          <button
            type="button"
            onClick={() => { setTopic('Tutorial Inventory'); }}
            className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-indigo-300 font-mono"
          >
            "Tutorial Inventory"
          </button>
          <button
            type="button"
            onClick={() => { setTopic('Graphics Quality Crash'); }}
            className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-indigo-300 font-mono"
          >
            "Graphics Quality Crash"
          </button>
          <button
            type="button"
            onClick={() => { setTopic('Multiplayer Netcode'); }}
            className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-indigo-300 font-mono"
          >
            "Multiplayer Netcode (Empty Test)"
          </button>
        </div>
      </div>

      {/* Execution Trace and Synthesis Report */}
      {agentResult && (
        <div className="space-y-6">
          {/* Agent Orchestration Trace */}
          <AgentTracePanel
            traces={agentResult.executionTrace}
            totalMs={agentResult.totalExecutionMs}
          />

          {agentResult.status === 'no_data' ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-amber-300 text-sm">Graceful Missing Data Response</div>
              <p>{agentResult.message}</p>
              <p className="text-[11px] text-slate-500">
                Rule verified: The AI agent never fabricates investigations when player feedback evidence is absent.
              </p>
            </div>
          ) : (
            <div className="p-6 bg-slate-900 border border-indigo-900/60 rounded-2xl shadow-xl space-y-6">
              {/* Proposal Header */}
              <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 uppercase">
                      Evidence Proposal Ready
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Build {agentResult.scope?.buildVersion}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {agentResult.investigationTitle}
                  </h2>
                </div>

                {/* Key Metrics Badges */}
                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Frequency</div>
                    <div className="font-bold text-purple-300 text-sm">
                      {agentResult.metrics?.distinctAffectedSessions} Distinct Sessions
                    </div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Reports</div>
                    <div className="font-bold text-cyan-300 text-sm">
                      {agentResult.metrics?.totalReports} Reports
                    </div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Confidence</div>
                    <div className="font-bold text-emerald-300 text-sm">
                      {agentResult.metrics?.clusterConfidenceScore} Score
                    </div>
                  </div>
                </div>
              </div>

              {/* Facts vs Hypotheses */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Known Facts (Verified Data)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {agentResult.evidence?.knownFacts?.map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 shrink-0">&bull;</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Hypotheses (Requires Verification)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {agentResult.evidence?.hypotheses?.map((hyp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 shrink-0">&bull;</span>
                        <span>{hyp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Missing Reproduction Details Analysis */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Missing Reproduction Information
                </div>
                <p className="text-slate-400">{agentResult.evidence?.missingReproductionDetails}</p>
              </div>

              {/* Actionable Recommendations */}
              <div className="p-4 bg-indigo-950/40 border border-indigo-900/60 rounded-xl space-y-3 text-xs">
                <div>
                  <span className="font-bold text-indigo-300 block mb-1">
                    Suggested Follow-Up Test for Next Playtest:
                  </span>
                  <p className="text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 font-medium">
                    {agentResult.evidence?.suggestedFollowUpTest}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-indigo-300 block mb-1">
                    Suggested Engineering Action:
                  </span>
                  <p className="text-slate-300">
                    {agentResult.evidence?.suggestedNextAction}
                  </p>
                </div>
              </div>

              {/* Evidence Cluster Reports Excerpts */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Supporting Clustered Reports Excerpts ({agentResult.cluster?.reports?.length || 0})
                </div>
                <div className="grid gap-3">
                  {agentResult.cluster?.reports?.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-200">{r.title}</div>
                        <p className="text-slate-400 italic">"{r.description}"</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono text-cyan-300 bg-cyan-950 border border-cyan-800 shrink-0">
                        {(r.similarityScore * 100).toFixed(1)}% match
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Developer Human-In-The-Loop Approval Box */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Human-in-the-loop: The AI agent cannot create or confirm an issue without explicit developer approval.
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleApproveProposal}
                    disabled={approvalLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{approvalLoading ? 'Creating Issue...' : 'Approve & Create Confirmed Issue'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
