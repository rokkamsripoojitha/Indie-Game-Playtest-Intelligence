import React, { useState, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  AlertOctagon,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Wrench,
  ShieldCheck,
  User,
  Clock,
  FileText,
  Filter
} from 'lucide-react';

export const IssuesWorkspacePage = () => {
  const { activeStudio, builds, isDeveloper } = useStudio();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Modals & Action States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // New Issue Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('high');
  const [buildId, setBuildId] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadIssues = async (selectId = null) => {
    if (!activeStudio?._id) return;
    try {
      setLoading(true);
      const res = await api.listIssues(activeStudio._id, {
        ...(statusFilter ? { status: statusFilter } : {})
      });
      const list = res.issues || [];
      setIssues(list);

      if (selectId) {
        const found = list.find(i => i._id === selectId);
        if (found) setSelectedIssue(found);
      } else if (!selectedIssue && list.length > 0) {
        setSelectedIssue(list[0]);
      } else if (selectedIssue) {
        // Refresh currently selected issue
        const refreshed = list.find(i => i._id === selectedIssue._id);
        if (refreshed) setSelectedIssue(refreshed);
      }
    } catch (err) {
      console.warn('Error loading issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, [activeStudio?._id, statusFilter]);

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    if (!title || !description) return;
    setActionLoading(true);
    setError('');

    try {
      const res = await api.createIssue({
        studioId: activeStudio._id,
        buildScope: buildId ? [buildId] : (builds[0] ? [builds[0]._id] : []),
        title,
        description,
        severity
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setMessage(`Issue "${res.issue.title}" created.`);
      await loadIssues(res.issue._id);
    } catch (err) {
      setError(err.message || 'Failed to create issue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmIssue = async () => {
    if (!selectedIssue) return;
    try {
      setActionLoading(true);
      setError('');
      setMessage('');
      const res = await api.confirmIssue(activeStudio._id, selectedIssue._id);
      setMessage(res.message);
      await loadIssues(selectedIssue._id);
    } catch (err) {
      setError(err.message || 'Failed to confirm issue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyFix = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;
    try {
      setActionLoading(true);
      setError('');
      setMessage('');
      const res = await api.verifyFix(activeStudio._id, selectedIssue._id, verifyNotes);
      setMessage(res.message);
      setShowVerifyModal(false);
      setVerifyNotes('');
      await loadIssues(selectedIssue._id);
    } catch (err) {
      setError(err.message || 'Failed to mark fix verified.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-rose-400" />
            <span>Studio Issue Tracker & Fix Verification</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Confirmed bugs, clustered player evidence, and developer-verified fixes.
          </p>
        </div>

        {isDeveloper && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Tracking Issue</span>
          </button>
        )}
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs overflow-x-auto pb-1">
        {['', 'unconfirmed', 'confirmed', 'in_progress', 'verified_fix', 'closed'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors whitespace-nowrap ${
              statusFilter === st
                ? 'bg-slate-800 text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {st ? st.replace('_', ' ') : 'All Issues'}
          </button>
        ))}
      </div>

      {/* Master-Detail Layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Issue List */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading issues...</div>
          ) : issues.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-500">
              No issues match the selected filter.
            </div>
          ) : (
            issues.map(item => {
              const isSelected = selectedIssue?._id === item._id;
              return (
                <div
                  key={item._id}
                  onClick={() => setSelectedIssue(item)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500 shadow-md'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-slate-200 text-xs truncate flex-1">
                      {item.title}
                    </h3>
                    <StatusBadge type="severity" value={item.severity} />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <StatusBadge type="status" value={item.status} />
                    <span>Evidence: {item.evidenceReportIds?.length || 0} reports</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right 7 Cols: Selected Issue Details & Actions */}
        <div className="lg:col-span-7">
          {selectedIssue ? (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
              <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <StatusBadge type="severity" value={selectedIssue.severity} />
                    <StatusBadge type="status" value={selectedIssue.status} />
                    {selectedIssue.buildScope?.[0]?.version && (
                      <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        Build: {selectedIssue.buildScope[0].version}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{selectedIssue.title}</h2>
                </div>

                {/* Developer Actions */}
                {isDeveloper && (
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedIssue.status === 'unconfirmed' && (
                      <button
                        onClick={handleConfirmIssue}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Issue</span>
                      </button>
                    )}

                    {selectedIssue.status !== 'verified_fix' && selectedIssue.status !== 'closed' && (
                      <button
                        onClick={() => setShowVerifyModal(true)}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-colors disabled:opacity-50"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Verify Fix</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Created by: {selectedIssue.createdBy?.name || 'Developer'}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {new Date(selectedIssue.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Verified Fix Banner */}
              {selectedIssue.status === 'verified_fix' && selectedIssue.verificationDetails?.verifiedBy && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Fix Verified by Developer</span>
                  </div>
                  <p className="text-slate-300">
                    Verified on {new Date(selectedIssue.verificationDetails.verifiedAt).toLocaleString()}
                  </p>
                  {selectedIssue.verificationDetails.notes && (
                    <p className="text-slate-400 italic">"{selectedIssue.verificationDetails.notes}"</p>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Issue Description & Triage Notes
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedIssue.description}
                </div>
              </div>

              {/* Linked Evidence Reports */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Clustered Player Evidence Reports ({selectedIssue.evidenceReportIds?.length || 0})</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(!selectedIssue.evidenceReportIds || selectedIssue.evidenceReportIds.length === 0) ? (
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-500 text-xs">
                      No feedback reports linked to this issue yet.
                    </div>
                  ) : (
                    selectedIssue.evidenceReportIds.map(rep => (
                      <div key={rep._id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                        <div className="font-semibold text-slate-200">{rep.title}</div>
                        <p className="text-slate-400 line-clamp-2">{rep.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-500">
              Select an issue from the left to view details and triage actions.
            </div>
          )}
        </div>
      </div>

      {/* New Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>Create New Tracking Issue</span>
            </h2>

            <form onSubmit={handleCreateIssue} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Missing Item Hotkey Tutorial Prompt"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Build</label>
                  <select
                    value={buildId}
                    onChange={(e) => setBuildId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Build</option>
                    {builds.map(b => (
                      <option key={b._id} value={b._id}>{b.version} ({b.buildName})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description & Evidence Details *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the problem scope, component affected, and root cause notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg"
                >
                  {actionLoading ? 'Creating...' : 'Create Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
