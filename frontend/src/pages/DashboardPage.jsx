import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Gamepad2,
  Calendar,
  MessageSquare,
  AlertOctagon,
  Bot,
  Copy,
  FolderGit2,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Hash,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { activeStudio, builds, sessions, isDeveloper, isStudioAdmin, isTester, userRole } = useStudio();

  const [feedbackReports, setFeedbackReports] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectedBuild = builds[0] || null;

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!activeStudio?._id) return;
      try {
        setLoading(true);
        const [feedbackRes, issuesRes] = await Promise.all([
          api.listFeedback(activeStudio._id),
          (isDeveloper || isStudioAdmin) ? api.listIssues(activeStudio._id) : Promise.resolve({ issues: [] })
        ]);
        setFeedbackReports(feedbackRes.reports || []);
        setIssues(issuesRes.issues || []);
      } catch (err) {
        console.warn('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [activeStudio?._id, isDeveloper, isStudioAdmin]);

  // Real calculations
  const totalReportsCount = feedbackReports.length;
  const distinctSessionIds = [...new Set(feedbackReports.map(r => r.sessionId?._id || r.sessionId).filter(Boolean))];
  const distinctSessionCount = distinctSessionIds.length;
  const unresolvedIssues = issues.filter(i => i.status === 'unconfirmed' || i.status === 'confirmed');

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
              Playtest Analytics Overview
            </span>
            <StatusBadge type="role" value={userRole} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {activeStudio ? activeStudio.name : 'No Active Studio Selected'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {activeStudio?.description || 'Connect or create a game studio to begin analyzing feedback.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isDeveloper && (
            <Link
              to="/ai-workspace"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Bot className="w-4 h-4" />
              <span>Launch AI Workspace</span>
            </Link>
          )}
          <Link
            to="/feedback"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Feedback Workspace</span>
          </Link>
        </div>
      </div>

      {/* Real Live Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Feedback</span>
            <MessageSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalReportsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Submitted reports</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Distinct Sessions</span>
            <Hash className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{distinctSessionCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Affected cohorts</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Builds</span>
            <FolderGit2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{builds.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {selectedBuild ? selectedBuild.version : 'None registered'}
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tracking Issues</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{issues.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {unresolvedIssues.length} open / confirmed
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Feedback + AI QA Shortcuts */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Recent Feedback Reports */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Incoming Feedback Feed</span>
            </h2>
            <Link to="/feedback" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {feedbackReports.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-xs">
                No feedback reports registered yet for this studio.
              </div>
            ) : (
              feedbackReports.slice(0, 5).map(report => (
                <div
                  key={report._id}
                  className="p-4 bg-slate-900/70 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="font-semibold text-slate-200 text-sm">{report.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {report.buildId?.version || 'Build'}
                      </span>
                      <StatusBadge type="status" value={report.status} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{report.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                    <span>Tester: {report.testerId?.name || 'Tester'}</span>
                    <div className="flex items-center gap-3">
                      {isDeveloper && (
                        <Link
                          to={`/feedback?reportId=${report._id}`}
                          className="text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Inspect Duplicates</span>
                        </Link>
                      )}
                      <Link to="/feedback" className="text-indigo-400 hover:underline">
                        Details &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: AI & QA Intelligence Action Hub */}
        <div className="space-y-6">
          {/* AI Pre-Playtest Agent Card */}
          {isDeveloper && (
            <div className="p-5 bg-gradient-to-b from-indigo-950/60 to-slate-900/90 border border-indigo-900/60 rounded-xl shadow-lg">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Investigation Agent</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">
                "What should we investigate before the next playtest?"
              </h3>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Automatically clusters feedback, checks issue states, counts affected cohorts, and drafts evidence proposals for developer review.
              </p>
              <Link
                to="/ai-workspace"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <span>Open AI Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* RAG Chat Assistant Card */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Build QA Assistant</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Grounded Setup & Controls Q&A</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Ask build-specific questions verified strictly against official indexed developer documentation with citations.
            </p>
            <Link
              to="/ai-workspace"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <span>Launch QA Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Active Playtest Sessions List */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Active Sessions
              </span>
              <Link to="/studio" className="text-[11px] text-indigo-400 hover:underline">
                Manage
              </Link>
            </div>
            <div className="space-y-2 text-xs">
              {sessions.length === 0 ? (
                <div className="text-slate-500 text-center py-2">No playtest sessions found.</div>
              ) : (
                sessions.slice(0, 3).map(s => (
                  <div key={s._id} className="p-2.5 bg-slate-950 rounded border border-slate-800/80">
                    <div className="font-semibold text-slate-200">{s.title}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>Code: <code className="text-indigo-300">{s.accessCode}</code></span>
                      <StatusBadge type="status" value={s.feedbackSharingPolicy} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
