import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  AlertOctagon,
  PlusCircle,
  Filter,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const IssuesPage = () => {
  const { activeStudio, builds, isDeveloper } = useStudio();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Issue Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [buildId, setBuildId] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');

  const loadIssues = async () => {
    if (!activeStudio?._id) return;
    try {
      setLoading(true);
      const res = await api.listIssues(activeStudio._id, {
        ...(statusFilter ? { status: statusFilter } : {})
      });
      setIssues(res.issues || []);
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
    setCreateLoading(true);
    setError('');

    try {
      await api.createIssue({
        studioId: activeStudio._id,
        buildScope: buildId ? [buildId] : (builds[0] ? [builds[0]._id] : []),
        title,
        description,
        severity
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      await loadIssues();
    } catch (err) {
      setError(err.message || 'Failed to create issue.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-rose-400" />
            <span>Studio Issue Tracker</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Confirmed bugs, friction triage, and developer fix verification records.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Tracking Issue</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs overflow-x-auto">
        {['', 'unconfirmed', 'confirmed', 'in_progress', 'verified_fix', 'closed'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-2 border-b-2 font-medium capitalize transition-colors whitespace-nowrap ${
              statusFilter === st
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {st ? st.replace('_', ' ') : 'All Issues'}
          </button>
        ))}
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading issues...</div>
        ) : issues.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
            No issues found matching the selected filter.
          </div>
        ) : (
          issues.map(issue => (
            <div
              key={issue._id}
              className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Link
                    to={`/issues/${issue._id}`}
                    className="font-bold text-slate-100 text-sm hover:text-indigo-400 transition-colors"
                  >
                    {issue.title}
                  </Link>
                  <StatusBadge type="severity" value={issue.severity} />
                  <StatusBadge type="status" value={issue.status} />
                  {issue.buildScope?.[0]?.version && (
                    <span className="text-[11px] font-mono text-slate-400">
                      Build: {issue.buildScope[0].version}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{issue.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Evidence Reports: {issue.evidenceReportIds?.length || 0}</span>
                  <span>•</span>
                  <span>Created by: {issue.createdBy?.name || 'Developer'}</span>
                  <span>•</span>
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <Link
                to={`/issues/${issue._id}`}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors shrink-0"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Create New Tracking Issue</h2>

            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-300 text-xs">
                {error}
              </div>
            )}

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
                      <option key={b._id} value={b._id}>
                        {b.version} ({b.buildName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description & Evidence *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the bug scope, root cause hypotheses, and affected game components..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {createLoading ? 'Saving...' : 'Create Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
