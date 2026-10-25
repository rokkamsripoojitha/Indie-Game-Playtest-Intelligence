import React from 'react';

export const StatusBadge = ({ type = 'status', value }) => {
  if (!value) return null;

  const normalized = String(value).toLowerCase();

  const getStyle = () => {
    switch (normalized) {
      // Roles
      case 'studio_admin':
        return 'bg-purple-950/70 text-purple-300 border-purple-800';
      case 'developer':
        return 'bg-indigo-950/70 text-indigo-300 border-indigo-800';
      case 'tester':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800';

      // Issue Statuses
      case 'unconfirmed':
        return 'bg-amber-950/70 text-amber-300 border-amber-800';
      case 'confirmed':
        return 'bg-rose-950/70 text-rose-300 border-rose-800';
      case 'in_progress':
        return 'bg-blue-950/70 text-blue-300 border-blue-800';
      case 'verified_fix':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800';
      case 'closed':
        return 'bg-slate-800 text-slate-400 border-slate-700';

      // Severity
      case 'critical':
        return 'bg-red-950 text-red-300 border-red-800 font-bold';
      case 'high':
        return 'bg-orange-950 text-orange-300 border-orange-800';
      case 'medium':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'low':
        return 'bg-slate-800 text-slate-300 border-slate-700';

      // Decisions
      case 'accepted':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'dismissed':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'suggested':
        return 'bg-sky-950 text-sky-300 border-sky-800';

      // Sharing
      case 'shared':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'private':
        return 'bg-slate-800 text-slate-400 border-slate-700';

      // Defaults
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const formatText = (text) => {
    return text.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStyle()}`}
    >
      {formatText(normalized)}
    </span>
  );
};
