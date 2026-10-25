import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!token || !email) {
      setError('Missing verification token or email address in link.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.verifyEmail({ token, email });
      setVerified(true);
    } catch (err) {
      setError(err.message || 'Verification failed. The token may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && email) {
      handleVerify();
    }
  }, [token, email]);

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl text-center">
      <h1 className="text-2xl font-bold text-white mb-2">Email Verification</h1>
      <p className="text-xs text-slate-400 mb-6">
        Confirming playtester email identity for account security.
      </p>

      {loading && (
        <div className="py-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <span className="text-xs text-slate-400">Verifying single-use cryptographic token...</span>
        </div>
      )}

      {verified && (
        <div className="py-6 space-y-4">
          <div className="w-12 h-12 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-emerald-300">Email Verified Successfully!</div>
          <p className="text-xs text-slate-300">
            Your account ({email}) is now verified and active.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {error && (
        <div className="py-6 space-y-4">
          <div className="w-12 h-12 bg-rose-950 border border-rose-800 rounded-full flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-rose-300">Verification Failed</div>
          <p className="text-xs text-slate-400">{error}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
          >
            <span>Return to Login</span>
          </Link>
        </div>
      )}
    </div>
  );
};
