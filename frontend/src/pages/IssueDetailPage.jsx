import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  AlertOctagon,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Wrench,
  Clock,
  User,
  FileText
} from 'lucide-react';

export const IssueDetailPage = () => {
  const { issueId } = useParams();
  const { activeStudio, isDeveloper } = useStudio();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadIssue = async () => {
    if (!activeStudio?._id || !issueId) return;
    try {
      setLoading(true);
      const res = await api.getIssueById(activeStudio._id, issueId);
      setIssue(res.issue);
    } catch (err) {
      setError(err.message || 'Failed to load issue details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssue();
  }, [activeStudio?._id, issueId]);

  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      setError('');
      setMessage('');
      const res = await api.confirmIssue(activeStudio._id, issueId);
      setMessage(res.message);
      await loadIssue();
    } catch (err) {
      setError(err.message || 'Failed to confirm issue. Only authorized developers can confirm issues.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyFix = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError('');
      setMessage('');
      const res = await api.verifyFix(activeStudio._id, issueId, verifyNotes);
      setMessage(res.message);
      setShowVerifyModal(false);
      setVerifyNotes('');
      await loadIssue();
    } catch (err) {
      setError(err.message || 'Failed to verify fix. Only authorized developers can verify fixes.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading issue details...</div>;
  }

  if (!issue) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="text-rose-400 font-semibold text-sm">Issue Not Found</div>
        <p className="text-xs text-slate-400">{error || 'This issue does not exist or access is restricted.'}</p>
        <Link to="/issues" className="inline-block text-xs text-indigo-400 hover:underline">
          &larr; Return to Issue Tracker
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/issues"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Issue Tracker</span>
        </Link>

        {/* Developer Action Buttons */}
        <div className="flex items-center gap-2">
          {issue.status === 'unconfirmed' && (
            <button
              onClick={handleConfirm}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm Issue (Developer)</span>
            </button>
          )}

          {issue.status !== 'verified_fix' && issue.status !== 'closed' && (
            <button
              onClick={() => setShowVerifyModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-colors disabled:opacity-50"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Mark Fix Verified (Developer)</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-900 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Issue Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge type="severity" value={issue.severity} />
            <StatusBadge type="status" value={issue.status} />
            {issue.buildScope?.[0]?.version && (
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Build: {issue.buildScope[0].version}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{issue.title}</h1>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Created by: {issue.createdBy?.name || 'Developer'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {new Date(issue.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Verification Record Banner if verified */}
        {issue.status === 'verified_fix' && issue.verificationDetails?.verifiedBy && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-xs space-y-1">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Fix Record</span>
            </div>
            <p className="text-slate-300">
              Verified by: <strong>{issue.verificationDetails.verifiedBy.name}</strong> on{' '}
              {new Date(issue.verificationDetails.verifiedAt).toLocaleString()}
            </p>
            {issue.verificationDetails.notes && (
              <p className="text-slate-400 italic">"{issue.verificationDetails.notes}"</p>
            )}
          </div>
        )}

        {/* Description */}
        <div className="space-y-1.5">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Issue Description & Triage Details
          </h2>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            {issue.description}
          </div>
        </div>

        {/* Evidence Feedback Reports Clustered */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Associated Evidence Reports ({issue.evidenceReportIds?.length || 0})</span>
          </h2>

          <div className="space-y-2">
            {(!issue.evidenceReportIds || issue.evidenceReportIds.length === 0) ? (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs">
                No feedback reports linked to this issue yet.
              </div>
            ) : (
              issue.evidenceReportIds.map(rep => (
                <div
                  key={rep._id}
                  className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-200">{rep.title}</div>
                    <p className="text-slate-400 line-clamp-2">{rep.description}</p>
                    {rep.stepsToReproduce && (
                      <p className="text-[11px] text-slate-400 font-mono">
                        Repro: {rep.stepsToReproduce}
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/feedback/${rep._id}`}
                    className="text-indigo-400 hover:underline shrink-0 text-xs"
                  >
                    View Original &rarr;
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Verify Fix Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span>Verify Fix Confirmation</span>
            </h2>
            <p className="text-xs text-slate-400">
              Only authorized developers can sign off on verified fixes. Enter verification notes:
            </p>

            <form onSubmit={handleVerifyFix} className="space-y-4 text-xs">
              <textarea
                required
                rows={3}
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="e.g. Verified in internal build v1.0.2: On-screen prompt TAB displays properly on prologue tutorial milestone."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                >
                  Confirm Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
