import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register(name, email, password);
      setSuccessInfo(res);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Create Tester Account</h1>
        <p className="text-xs text-slate-400 mt-1">
          Join playtests, submit feedback, and explore game builds.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-950/50 border border-rose-900 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successInfo ? (
        <div className="p-4 bg-emerald-950/50 border border-emerald-900 rounded-xl text-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Registration Successful!</span>
          </div>
          <p className="text-slate-300">
            A verification link was generated for <strong>{email}</strong>. Please verify your email before logging in.
          </p>
          {successInfo.previewUrl && (
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono break-all">
              <span className="text-indigo-400 block mb-1">Local Dev Verification Link:</span>
              <a href={successInfo.previewUrl} className="text-cyan-400 hover:underline">
                {successInfo.previewUrl}
              </a>
            </div>
          )}
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500"
            >
              <span>Proceed to Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@playtest.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              By policy, public signups receive the <strong>Tester</strong> role by default. Developer or Studio Admin privileges require an authorized invitation from a Studio Administrator.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Complete Sign Up'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:underline font-medium">
          Sign In
        </Link>
      </div>
    </div>
  );
};
