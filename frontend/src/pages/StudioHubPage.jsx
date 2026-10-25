import React, { useState, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Building2,
  Calendar,
  FolderGit2,
  Users,
  PlusCircle,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Mail,
  ShieldCheck,
  Trash2,
  Clock,
  Layers
} from 'lucide-react';

export const StudioHubPage = () => {
  const { activeStudio, builds, sessions, refreshBuilds, refreshSessions, isDeveloper } = useStudio();
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions', 'builds', 'members'

  // SESSIONS STATE
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [sessionBuildId, setSessionBuildId] = useState(builds[0]?._id || '');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionPolicy, setSessionPolicy] = useState('private');

  // BUILDS STATE
  const [showCreateBuildModal, setShowCreateBuildModal] = useState(false);
  const [buildName, setBuildName] = useState('');
  const [buildVersion, setBuildVersion] = useState('');
  const [buildNotes, setBuildNotes] = useState('');

  // MEMBERS & INVITES STATE
  const [members, setMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [inviteResult, setInviteResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Sync initial build
  useEffect(() => {
    if (!sessionBuildId && builds.length > 0) setSessionBuildId(builds[0]._id);
  }, [builds]);

  // Load Members
  const loadMembers = async () => {
    if (!activeStudio?._id) return;
    try {
      const res = await api.listMembers(activeStudio._id);
      setMembers(res.members || []);
    } catch (err) {
      console.warn('Error loading members:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'members') {
      loadMembers();
    }
  }, [activeTab, activeStudio?._id]);

  // Join Session Handler
  const handleJoinSession = async (e) => {
    e.preventDefault();
    if (!accessCode) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.joinSessionWithCode({ accessCode });
      setMessage(res.message);
      setShowJoinModal(false);
      setAccessCode('');
      await refreshSessions();
    } catch (err) {
      setError(err.message || 'Failed to join session. Verify access code.');
    } finally {
      setLoading(false);
    }
  };

  // Create Session Handler
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionBuildId || !sessionTitle) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.createSession({
        studioId: activeStudio._id,
        buildId: sessionBuildId,
        title: sessionTitle,
        description: sessionDescription,
        feedbackSharingPolicy: sessionPolicy
      });
      setMessage(`Playtest Session "${res.session.title}" created with access code: ${res.session.accessCode}`);
      setShowCreateSessionModal(false);
      setSessionTitle('');
      setSessionDescription('');
      await refreshSessions();
    } catch (err) {
      setError(err.message || 'Failed to create session.');
    } finally {
      setLoading(false);
    }
  };

  // Create Build Handler
  const handleCreateBuild = async (e) => {
    e.preventDefault();
    if (!buildName || !buildVersion) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.createBuild({
        studioId: activeStudio._id,
        buildName,
        version: buildVersion,
        releaseNotes: buildNotes
      });
      setMessage(res.message);
      setShowCreateBuildModal(false);
      setBuildName('');
      setBuildVersion('');
      setBuildNotes('');
      await refreshBuilds();
    } catch (err) {
      setError(err.message || 'Failed to create game build.');
    } finally {
      setLoading(false);
    }
  };

  // Issue Invite Handler
  const handleIssueInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setLoading(true);
    setError('');
    setInviteResult(null);

    try {
      const res = await api.issueInvitation({
        studioId: activeStudio._id,
        email: inviteEmail,
        role: inviteRole
      });
      setInviteResult(res);
      setInviteEmail('');
      await loadMembers();
    } catch (err) {
      setError(err.message || 'Failed to issue invitation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <span>Studio Management Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage playtest cohorts, game builds, team authorizations, and single-use invites.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'sessions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sessions ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('builds')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'builds'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Builds ({builds.length})</span>
          </button>

          {isDeveloper && (
            <button
              onClick={() => setActiveTab('members')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'members'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Team & Invites</span>
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

      {/* TAB 1: SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Playtest Cohorts & Privacy Policies
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Join with Code</span>
              </button>

              {isDeveloper && (
                <button
                  onClick={() => setShowCreateSessionModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Session</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {sessions.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-500 md:col-span-2">
                No playtest sessions found. Join with an access code or create a session.
              </div>
            ) : (
              sessions.map(s => (
                <div key={s._id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">{s.title}</h3>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        Code: <strong className="text-indigo-400">{s.accessCode}</strong>
                      </div>
                    </div>
                    <StatusBadge type="status" value={s.feedbackSharingPolicy} />
                  </div>

                  {s.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{s.description}</p>
                  )}

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                    <span>Target Build: {s.buildId?.version || 'N/A'}</span>
                    <span>Testers: {s.permittedTesters?.length || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BUILDS */}
      {activeTab === 'builds' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Registered Executable Builds
            </span>
            {isDeveloper && (
              <button
                onClick={() => setShowCreateBuildModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Register Build</span>
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {builds.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-500 md:col-span-2">
                No builds registered yet.
              </div>
            ) : (
              builds.map(b => (
                <div key={b._id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">{b.buildName}</h3>
                      <span className="text-xs font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900 mt-1 inline-block">
                        {b.version}
                      </span>
                    </div>
                    <StatusBadge type="status" value={b.status} />
                  </div>

                  {b.releaseNotes && (
                    <p className="text-xs text-slate-400 line-clamp-2 bg-slate-950 p-2.5 rounded border border-slate-800">
                      {b.releaseNotes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TEAM & INVITATIONS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Studio Personnel ({members.length})
            </span>
            <button
              onClick={() => {
                setShowInviteModal(true);
                setInviteResult(null);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Issue Invitation Token</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800 text-xs">
            {members.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Loading personnel...</div>
            ) : (
              members.map(m => (
                <div key={m.membershipId} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-200 flex items-center gap-2">
                      <span>{m.user?.name}</span>
                      <StatusBadge type="role" value={m.role} />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{m.user?.email}</div>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Joined: {new Date(m.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Join Session Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Join Playtest Session</span>
            </h2>
            <form onSubmit={handleJoinSession} className="space-y-4 text-xs">
              <input
                type="text"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="e.g. DEMO-SES1"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-center tracking-widest text-sm focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Create Playtest Session</span>
            </h2>
            <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Build *</label>
                <select
                  value={sessionBuildId}
                  onChange={(e) => setSessionBuildId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {builds.map(b => (
                    <option key={b._id} value={b._id}>{b.version} ({b.buildName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Beta Tutorial Friction Study"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Feedback Privacy Policy</label>
                <select
                  value={sessionPolicy}
                  onChange={(e) => setSessionPolicy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="private">Private (Testers only see their own feedback)</option>
                  <option value="shared">Shared (Testers in cohort can see shared reports)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Objectives</label>
                <textarea
                  rows={3}
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder="Target objectives for players..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSessionModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Build Modal */}
      {showCreateBuildModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-indigo-400" />
              <span>Register Game Build</span>
            </h2>
            <form onSubmit={handleCreateBuild} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Build Name *</label>
                <input
                  type="text"
                  required
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  placeholder="e.g. Project ChronoShift Alpha"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Version String *</label>
                <input
                  type="text"
                  required
                  value={buildVersion}
                  onChange={(e) => setBuildVersion(e.target.value)}
                  placeholder="e.g. v1.0.2-beta"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Release Notes</label>
                <textarea
                  rows={3}
                  value={buildNotes}
                  onChange={(e) => setBuildNotes(e.target.value)}
                  placeholder="Notes on playable areas..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBuildModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" />
              <span>Issue Single-Use Invitation</span>
            </h2>

            {inviteResult ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-900 rounded-xl text-xs space-y-2">
                <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Invitation Issued!</span>
                </div>
                <p className="text-slate-300">{inviteResult.message}</p>
                {inviteResult.previewUrl && (
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] break-all">
                    <span className="text-indigo-400 block mb-0.5">Dev Preview Link:</span>
                    <a href={inviteResult.previewUrl} className="text-cyan-400 hover:underline">
                      {inviteResult.previewUrl}
                    </a>
                  </div>
                )}
                <div className="pt-2">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleIssueInvite} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Invitee Email *</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@studio.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="developer">Game Developer</option>
                    <option value="tester">Playtester</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                  >
                    Issue Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
