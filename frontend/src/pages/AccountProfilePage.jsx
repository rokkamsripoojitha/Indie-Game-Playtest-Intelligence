import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudio } from '../context/StudioContext';
import { StatusBadge } from '../components/StatusBadge';
import { User, Mail, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export const AccountProfilePage = () => {
  const { user } = useAuth();
  const { activeStudio, userRole } = useStudio();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-400" />
          <span>Account Profile & Security</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your credentials, email verification status, and active studio authorizations.
        </p>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="text-lg font-bold text-white">{user.name}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Email Verified</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Default Global Role</span>
            <div className="text-slate-200 capitalize font-medium">{user.systemRole || 'tester'}</div>
            <div className="text-[10px] text-slate-400">Public signup baseline</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Active Studio Role</span>
            <div>
              <StatusBadge type="role" value={userRole} />
            </div>
            <div className="text-[10px] text-slate-400">{activeStudio?.name || 'No Studio'}</div>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300">Security & Session Policy:</div>
          <div>&bull; Authenticated via encrypted server-side sessions stored in MongoDB Atlas.</div>
          <div>&bull; HttpOnly, SameSite cookies with CSRF token double-submit verification.</div>
          <div>&bull; Deny-by-default access control strictly verified on the backend.</div>
        </div>
      </div>
    </div>
  );
};
