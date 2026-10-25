import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudio } from '../context/StudioContext';
import { StatusBadge } from './StatusBadge';
import {
  Gamepad2,
  Building2,
  ChevronDown,
  LogOut,
  User,
  PlusCircle,
  ShieldAlert
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { studios, activeStudio, setActiveStudio, userRole } = useStudio();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:border-indigo-400 transition-colors">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm tracking-tight block">
                Playtest Intelligence
              </span>
              <span className="text-[10px] text-indigo-400 font-mono tracking-wider block">
                AI QA PLATFORM
              </span>
            </div>
          </Link>

          {/* Active Studio Selector */}
          {studios.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-800">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={activeStudio?._id || ''}
                onChange={(e) => {
                  const selected = studios.find(s => s._id === e.target.value);
                  if (selected) setActiveStudio(selected);
                }}
                className="bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {studios.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.myRole})
                  </option>
                ))}
              </select>

              <StatusBadge type="role" value={userRole} />
            </div>
          )}
        </div>

        {/* User Account & Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <div className="text-xs font-medium text-slate-200">{user.name}</div>
                <div className="text-[11px] text-slate-400">{user.email}</div>
              </div>

              <Link
                to="/account"
                className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
                title="Account Settings"
              >
                <User className="w-4 h-4" />
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/50 rounded-lg border border-rose-900/60 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm shadow-indigo-500/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
