import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const AccessDeniedPage = () => {
  return (
    <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-rose-900/60 rounded-2xl text-center space-y-4 shadow-2xl">
      <div className="w-14 h-14 bg-rose-950/80 border border-rose-800 rounded-full flex items-center justify-center mx-auto text-rose-400">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-white">403 — Access Restricted</h1>
      <p className="text-xs text-slate-400 leading-relaxed">
        You do not possess the required studio permissions or role authorization to perform this action or view this resource.
      </p>
      <div className="pt-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
