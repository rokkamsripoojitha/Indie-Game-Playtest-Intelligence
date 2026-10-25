import React, { useState, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertCircle,
  Mail,
  Trash2,
  Send,
  Crown
} from 'lucide-react';

export const MembershipsPage = () => {
  const { activeStudio } = useStudio();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadMembers = async () => {
    if (!activeStudio?._id) return;
    try {
      setLoading(true);
      const res = await api.listMembers(activeStudio._id);
      setMembers(res.members || []);
    } catch (err) {
      setError(err.message || 'Failed to load studio members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [activeStudio?._id]);

  const handleRoleChange = async (membershipId, newRole) => {
    try {
      setMessage('');
      setError('');
      await api.updateMemberRole(activeStudio._id, membershipId, newRole);
      setMessage('Role updated successfully.');
      await loadMembers();
    } catch (err) {
      setError(err.message || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (membershipId) => {
    if (!window.confirm('Are you sure you want to remove this member from the studio?')) return;
    try {
      setMessage('');
      setError('');
      await api.removeMember(activeStudio._id, membershipId);
      setMessage('Member removed.');
      await loadMembers();
    } catch (err) {
      setError(err.message || 'Failed to remove member.');
    }
  };

  const handleIssueInvitation = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
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
    } catch (err) {
      setError(err.message || 'Failed to issue invitation.');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            <span>Studio Members & Invitations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage authorized staff, assign RBAC permissions, and issue expiring invitation tokens.
          </p>
        </div>

        <button
          onClick={() => {
            setShowInviteModal(true);
            setInviteResult(null);
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
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

      {/* Members Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 font-semibold text-xs text-slate-200">
          Active Studio Personnel ({members.length})
        </div>

        <div className="divide-y divide-slate-800 text-xs">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No members found.</div>
          ) : (
            members.map(m => (
              <div
                key={m.membershipId}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-100 flex items-center gap-2">
                    <span>{m.user?.name || 'Unknown User'}</span>
                    <StatusBadge type="role" value={m.role} />
                  </div>
                  <div className="text-slate-400 text-[11px] font-mono mt-0.5">{m.user?.email}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Joined: {new Date(m.joinedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>Change Role:</span>
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.membershipId, e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="tester">Tester</option>
                      <option value="developer">Developer</option>
                      <option value="studio_admin">Studio Admin</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleRemoveMember(m.membershipId)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded"
                    title="Remove Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Issue Single-Use Studio Invitation</span>
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
                    <span className="text-indigo-400 block mb-1">Local Dev Invite URL:</span>
                    <a href={inviteResult.previewUrl} className="text-cyan-400 hover:underline">
                      {inviteResult.previewUrl}
                    </a>
                  </div>
                )}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleIssueInvitation} className="space-y-4 text-xs">
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
                  <label className="block font-semibold text-slate-300 mb-1">Intended Role *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="developer">Game Developer</option>
                    <option value="studio_admin">Studio Administrator</option>
                    <option value="tester">Playtester</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    {inviteLoading ? 'Generating Token...' : 'Issue Invitation'}
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
