import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Calendar,
  PlusCircle,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Users,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';

export const SessionsPage = () => {
  const { activeStudio, builds, sessions, refreshSessions, isDeveloper, isStudioAdmin } = useStudio();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Create Form
  const [buildId, setBuildId] = useState(builds[0]?._id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [feedbackSharingPolicy, setFeedbackSharingPolicy] = useState('private');

  // Join Form
  const [accessCode, setAccessCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync if builds load late
  React.useEffect(() => {
    if (!buildId && builds.length > 0) setBuildId(builds[0]._id);
  }, [builds]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!buildId || !title) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.createSession({
        studioId: activeStudio._id,
        buildId,
        title,
        description,
        feedbackSharingPolicy
      });
      setSuccess(`Session "${res.session.title}" created with code ${res.session.accessCode}.`);
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      await refreshSessions();
    } catch (err) {
      setError(err.message || 'Failed to create playtest session.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (e) => {
    e.preventDefault();
    if (!accessCode) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.joinSessionWithCode({ accessCode });
      setSuccess(res.message);
      setShowJoinModal(false);
      setAccessCode('');
      await refreshSessions();
    } catch (err) {
      setError(err.message || 'Failed to join session. Please check your access code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-400" />
            <span>Playtest Sessions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize player cohorts, configure feedback privacy policies, and invite testers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Join With Code</span>
          </button>

          {(isDeveloper || isStudioAdmin) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Session</span>
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-900 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sessions Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {sessions.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 md:col-span-2">
            No playtest sessions found. Join with an access code or create a new session.
          </div>
        ) : (
          sessions.map(s => (
            <div
              key={s._id}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-100 text-base">{s.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                    <span>Access Code:</span>
                    <strong className="text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-900">
                      {s.accessCode}
                    </strong>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusBadge type="status" value={s.feedbackSharingPolicy} />
                </div>
              </div>

              {s.description && (
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{s.description}</p>
              )}

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span>Target Build: {s.buildId?.version || 'N/A'}</span>
                  <span>Testers: {s.permittedTesters?.length || 0}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Sharing Policy:{' '}
                  {s.feedbackSharingPolicy === 'shared'
                    ? 'Shared (Testers in this cohort can inspect each other\'s feedback)'
                    : 'Private (Testers only see their own reports)'}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                <span>Status: {s.status}</span>
                <span>Created: {new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Join Session Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Join Playtest Session</span>
            </h2>
            <p className="text-xs text-slate-400">
              Enter the access code provided by the game studio (e.g. <code className="text-indigo-300">DEMO-SES1</code>):
            </p>

            <form onSubmit={handleJoinSession} className="space-y-4 text-xs">
              <input
                type="text"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="PLAY-XXXX or DEMO-SES1"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-center tracking-widest text-sm focus:outline-none focus:border-indigo-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  {loading ? 'Joining...' : 'Join Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Create Playtest Session</span>
            </h2>

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Build *</label>
                <select
                  value={buildId}
                  onChange={(e) => setBuildId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {builds.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.version} ({b.buildName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Beta Weekend Cohort 2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Feedback Sharing Policy</label>
                <select
                  value={feedbackSharingPolicy}
                  onChange={(e) => setFeedbackSharingPolicy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="private">Private (Testers only see their own feedback)</option>
                  <option value="shared">Shared (Testers in this session see shared feedback)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Session Scope / Objectives</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe target areas to test, e.g. tutorial flow, weapon crafting..."
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
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  {loading ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
