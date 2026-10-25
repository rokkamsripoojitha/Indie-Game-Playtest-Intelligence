import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStudio } from '../context/StudioContext';
import {
  LayoutDashboard,
  MessageSquare,
  AlertOctagon,
  Sparkles,
  Building2,
  FolderGit2
} from 'lucide-react';

export const Sidebar = () => {
  const { isDeveloper, activeStudio } = useStudio();

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
      isActive
        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
    }`;

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-900 flex flex-col p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Studio Header Card */}
      {activeStudio && (
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl mb-5">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Active Workspace
          </div>
          <div className="font-bold text-slate-200 text-sm truncate mt-0.5">
            {activeStudio.name}
          </div>
          <div className="text-[11px] text-indigo-400 capitalize mt-0.5 font-medium">
            Role: {activeStudio.myRole?.replace('_', ' ')}
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="space-y-6 flex-1">
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Workspaces
          </div>
          <nav className="space-y-1.5">
            <NavLink to="/dashboard" className={navClass}>
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Studio Dashboard</span>
            </NavLink>

            <NavLink to="/feedback" className={navClass}>
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Feedback & Duplicates</span>
            </NavLink>

            <NavLink to="/issues" className={navClass}>
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>Issue Tracker</span>
            </NavLink>

            <NavLink to="/ai-workspace" className={navClass}>
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Intelligence Hub</span>
            </NavLink>

            <NavLink to="/studio" className={navClass}>
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Studio & Playtests</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-900 text-[11px] text-slate-500 text-center font-mono">
        Playtest Intelligence v1.0
      </div>
    </aside>
  );
};
