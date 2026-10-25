import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search
} from 'lucide-react';

export const DuplicateReviewPage = () => {
  const [searchParams] = useSearchParams();
  const initialReportId = searchParams.get('reportId');
  const { activeStudio, builds } = useStudio();

  const [allReports, setAllReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(initialReportId || '');
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [error, setError] = useState('');

  // Load all reports to populate report switcher dropdown
  useEffect(() => {
    const loadReports = async () => {
      if (!activeStudio?._id) return;
      try {
        const res = await api.listFeedback(activeStudio._id);
        const list = res.reports || [];
        setAllReports(list);
        if (!selectedReportId && list.length > 0) {
          setSelectedReportId(list[0]._id);
        }
      } catch (err) {
        console.warn('Error loading reports list:', err);
      }
    };
    loadReports();
  }, [activeStudio?._id]);

  // Load duplicate candidates for the selected report
  const loadDuplicates = async (reportId) => {
    if (!activeStudio?._id || !reportId) return;
    try {
      setLoading(true);
      setError('');
      setActionSuccess('');
      const res = await api.getDuplicateCandidates(activeStudio._id, reportId);
      setReviewData(res);
    } catch (err) {
      setError(err.message || 'Failed to calculate semantic duplicate candidates.');
      setReviewData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReportId) {
      loadDuplicates(selectedReportId);
    }
  }, [selectedReportId, activeStudio?._id]);

  // Developer Decision Action (Accept Link or Dismiss)
  const handleDecision = async (candidateReportId, decisionStatus, similarityScore) => {
    try {
      setActionLoading(true);
      setActionSuccess('');
      await api.reviewDuplicateDecision({
        studioId: activeStudio._id,
        sourceReportId: selectedReportId,
        targetId: candidateReportId,
        targetType: 'report',
        decisionStatus,
        similarityScore,
        decisionReason: `Developer marked as ${decisionStatus} from side-by-side review workspace.`
      });

      setActionSuccess(`Candidate successfully marked as ${decisionStatus}. Original texts preserved.`);
      // Reload candidates to reflect updated decision status
      await loadDuplicates(selectedReportId);
    } catch (err) {
      setError(err.message || 'Failed to record decision.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Copy className="w-6 h-6 text-amber-400" />
            <span>Semantic Duplicate Discovery Workspace</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare incoming feedback against vector-indexed candidates side by side before confirming links.
          </p>
        </div>

        {/* Source Report Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Inspecting Report:</span>
          <select
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 max-w-xs truncate"
          >
            {allReports.map(r => (
              <option key={r._id} value={r._id}>
                {r.title} ({r.buildId?.version || 'Build'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-900 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
          <span>Executing vector similarity search...</span>
        </div>
      ) : !reviewData ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
          Select a feedback report above to inspect semantic candidates.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Engine & Policy Info Banner */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between text-xs flex-wrap gap-3">
            <div className="flex items-center gap-2 font-mono text-slate-300">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>
                Search Engine: <strong className="text-white">{reviewData.engine}</strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Strict Rule: Reports are never auto-merged or deleted.</span>
            </div>
          </div>

          {/* Side-by-Side Review Workspace */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Original Target Report */}
            <div className="p-5 bg-slate-900 border-2 border-indigo-500/40 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Target Feedback Report (Anchor)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(reviewData.originalReport.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div>
                <h2 className="text-base font-bold text-white mb-2">{reviewData.originalReport.title}</h2>
                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {reviewData.originalReport.description}
                </div>
              </div>

              {reviewData.originalReport.stepsToReproduce && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Steps to Reproduce:
                  </span>
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap">
                    {reviewData.originalReport.stepsToReproduce}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Detected Semantic Duplicate Candidates */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Semantic Candidates ({reviewData.candidates.length})</span>
                <span className="text-[11px] text-slate-400 font-normal">Ranked by Cosine Vector Score</span>
              </div>

              {reviewData.candidates.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
                  No other feedback reports exceeded the semantic similarity threshold within this studio and build.
                </div>
              ) : (
                reviewData.candidates.map((cand, idx) => {
                  const matchPct = (cand.similarityScore * 100).toFixed(1);
                  const isAccepted = cand.existingDecision?.status === 'accepted';
                  const isDismissed = cand.existingDecision?.status === 'dismissed';

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isAccepted
                          ? 'bg-emerald-950/30 border-emerald-800'
                          : isDismissed
                          ? 'bg-slate-950/40 border-slate-800 opacity-60'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-200 text-sm">{cand.report.title}</h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {cand.report._id}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                              cand.similarityScore >= 0.80
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border-amber-800'
                            }`}
                          >
                            {matchPct}% match
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap mb-3">
                        {cand.report.description}
                      </div>

                      {cand.report.stepsToReproduce && (
                        <div className="text-[11px] text-slate-400 mb-3 bg-slate-950/60 p-2 rounded border border-slate-800/60">
                          <span className="font-semibold text-slate-300">Reproduction: </span>
                          {cand.report.stepsToReproduce}
                        </div>
                      )}

                      {/* Developer Decision Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <div>
                          {isAccepted && (
                            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Accepted Duplicate Link
                            </span>
                          )}
                          {isDismissed && (
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Dismissed as Separate Bug
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleDecision(cand.report._id, 'dismissed', cand.similarityScore)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleDecision(cand.report._id, 'accepted', cand.similarityScore)}
                            className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Confirm Link</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
