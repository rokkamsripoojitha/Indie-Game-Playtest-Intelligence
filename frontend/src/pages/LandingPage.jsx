import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, ShieldCheck, Cpu, Search, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="py-12 px-4 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto pt-8 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 text-xs font-mono mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Full-Stack AI Capstone Project 08</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
          Playtest Intelligence for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
            Indie Game Studios
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8">
          Collect playtester feedback, discover semantically similar bug reports with vector search, answer build-specific setup questions using grounded RAG, and orchestrate evidence-backed AI investigations before your next playtest.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/login"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30"
          >
            <span>Launch Demo Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm transition-colors"
          >
            Create Tester Account
          </Link>
        </div>
      </div>

      {/* Feature Pillar Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 mb-4">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-100 text-base mb-2">Semantic Duplicate Discovery</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Detects differently worded bug reports describing the same underlying friction using high-dimensional embeddings and cosine vector matching. Never auto-merges or deletes tester observations.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400 mb-4">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-100 text-base mb-2">Build-Specific Grounded RAG</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Extracts, chunks, and retrieves official setup, controls, and troubleshooting documentation strictly isolated to the player's active build, returning verifiable citations.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-400 mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-100 text-base mb-2">Purposeful 3-Tool AI Agent</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Executes <code className="text-indigo-300">findFeedback</code>, <code className="text-amber-300">readIssueState</code>, and <code className="text-purple-300">countAffectedSessions</code> to generate pre-playtest investigation proposals with developer sign-off.
          </p>
        </div>
      </div>

      {/* Role Breakdown Table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 mb-12">
        <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-indigo-400" />
          <span>Role-Based Access Control & System Guardrails</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="font-bold text-emerald-400 uppercase tracking-wider mb-2">1. Playtester</div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Public signup default role</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Submit rich feedback reports</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Ask setup questions with RAG</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Isolated to permitted sessions</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="font-bold text-indigo-400 uppercase tracking-wider mb-2">2. Game Developer</div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Manage game builds & sessions</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Review side-by-side duplicates</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Run AI investigation agent</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Confirm issues & verify fixes</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="font-bold text-purple-400 uppercase tracking-wider mb-2">3. Studio Admin</div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Manage studio memberships</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Issue single-use invitations</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Configure studio policies</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Strict separation from dev QA actions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
