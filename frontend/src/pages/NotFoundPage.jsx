import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
      <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-white">404 — Page Not Found</h1>
      <p className="text-xs text-slate-400">
        The requested URL or studio workspace route does not exist.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};
