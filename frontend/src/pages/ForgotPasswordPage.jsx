import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.forgotPassword({ email });
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to submit password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold text-white mb-2 text-center">Reset Password</h1>
      <p className="text-xs text-slate-400 mb-6 text-center">
        Enter your registered email to receive an expiring single-use reset token.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-rose-950/50 border border-rose-900 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result ? (
        <div className="p-4 bg-emerald-950/40 border border-emerald-900 rounded-xl text-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Instructions Dispatched</span>
          </div>
          <p className="text-slate-300">{result.message}</p>
          {result.previewUrl && (
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono break-all">
              <span className="text-indigo-400 block mb-1">Local Dev Reset Link:</span>
              <a href={result.previewUrl} className="text-cyan-400 hover:underline">
                {result.previewUrl}
              </a>
            </div>
          )}
          <div className="pt-2">
            <Link to="/login" className="text-indigo-400 hover:underline text-xs">
              Return to Login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@lunarforge.demo"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Send Reset Link'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-slate-400">
        Remembered your password?{' '}
        <Link to="/login" className="text-indigo-400 hover:underline font-medium">
          Sign In
        </Link>
      </div>
    </div>
  );
};
