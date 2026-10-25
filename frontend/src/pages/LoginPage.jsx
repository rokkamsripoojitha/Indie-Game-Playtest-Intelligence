import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, UserCheck, Shield, Gamepad2 } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword = 'DemoPassword123!') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Studio Sign In</h1>
        <p className="text-xs text-slate-400 mt-1">
          Access your playtest telemetry, reports, and AI workflows.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-950/50 border border-rose-900 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

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
              placeholder="you@studio.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300">Password</label>
            <Link to="/forgot-password" className="text-[11px] text-indigo-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Capstone Evaluation Demo Credentials */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 mb-2">
          <UserCheck className="w-4 h-4" />
          <span>Capstone Demonstration Quick-Fill Accounts</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">
          Click any role below to pre-fill credentials from the seeded demonstration dataset:
        </p>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => fillCredentials('dev@lunarforge.demo')}
            className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-indigo-900/60 rounded-md text-left text-slate-300 transition-colors"
          >
            <div className="font-semibold text-indigo-300">Lead Developer</div>
            <div className="text-[10px] text-slate-400 truncate">dev@lunarforge.demo</div>
          </button>

          <button
            type="button"
            onClick={() => fillCredentials('admin@lunarforge.demo')}
            className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-purple-900/60 rounded-md text-left text-slate-300 transition-colors"
          >
            <div className="font-semibold text-purple-300">Studio Admin</div>
            <div className="text-[10px] text-slate-400 truncate">admin@lunarforge.demo</div>
          </button>

          <button
            type="button"
            onClick={() => fillCredentials('tester.alex@playtest.demo')}
            className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-emerald-900/60 rounded-md text-left text-slate-300 transition-colors"
          >
            <div className="font-semibold text-emerald-300">Tester A (Alex)</div>
            <div className="text-[10px] text-slate-400 truncate">tester.alex@playtest.demo</div>
          </button>

          <button
            type="button"
            onClick={() => fillCredentials('tester.blake@playtest.demo')}
            className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-emerald-900/60 rounded-md text-left text-slate-300 transition-colors"
          >
            <div className="font-semibold text-emerald-300">Tester B (Blake)</div>
            <div className="text-[10px] text-slate-400 truncate">tester.blake@playtest.demo</div>
          </button>

          <button
            type="button"
            onClick={() => fillCredentials('tester.casey@playtest.demo')}
            className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-emerald-900/60 rounded-md text-left text-slate-300 transition-colors"
          >
            <div className="font-semibold text-emerald-300">Tester C (Casey)</div>
            <div className="text-[10px] text-slate-400 truncate">tester.casey@playtest.demo</div>
          </button>

          <button
            type="button"
            onClick={() => fillCredentials('intruder@otherstudio.demo')}
            className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-rose-900/60 rounded-md text-left text-slate-300 transition-colors"
          >
            <div className="font-semibold text-rose-300">Intruder (Auth Reject)</div>
            <div className="text-[10px] text-slate-400 truncate">intruder@otherstudio.demo</div>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        New playtester?{' '}
        <Link to="/register" className="text-indigo-400 hover:underline font-medium">
          Create an account
        </Link>
      </div>
    </div>
  );
};
