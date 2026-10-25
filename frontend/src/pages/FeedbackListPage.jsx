import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  FileText,
  Filter,
  PlusCircle,
  Copy,
  ChevronRight,
  Calendar,
  Layers,
  Search
} from 'lucide-react';

export const FeedbackListPage = () => {
  const { activeStudio, builds, sessions, isDeveloper, isStudioAdmin } = useStudio();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBuild, setFilterBuild] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadReports = async () => {
    if (!activeStudio?._id) return;
    try {
      setLoading(true);
      const res = await api.listFeedback(activeStudio._id, {
        ...(filterBuild ? { buildId: filterBuild } : {}),
        ...(filterSession ? { sessionId: filterSession } : {})
      });
      setReports(res.reports || []);
    } catch (err) {
      console.warn('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [activeStudio?._id, filterBuild, filterSession]);

  const filtered = reports.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return r.title.toLowerCase().includes(term) || r.description.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Playtest Feedback Feed</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review submitted observations, triage issues, and discover semantic duplicates.
          </p>
        </div>

        <Link
          to="/feedback/new"
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Feedback</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report titles or descriptions..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={filterBuild}
          onChange={(e) => setFilterBuild(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Builds</option>
          {builds.map(b => (
            <option key={b._id} value={b._id}>
              {b.version} ({b.buildName})
            </option>
          ))}
        </select>

        <select
          value={filterSession}
          onChange={(e) => setFilterSession(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Sessions</option>
          {sessions.map(s => (
            <option key={s._id} value={s._id}>
              {s.title} ({s.accessCode})
            </option>
          ))}
        </select>
      </div>

      {/* Reports Table / Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading reports...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-xs">
            No feedback reports match the specified criteria.
          </div>
        ) : (
          filtered.map(report => (
            <div
              key={report._id}
              className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Link
                    to={`/feedback/${report._id}`}
                    className="font-bold text-slate-100 text-sm hover:text-indigo-400 transition-colors"
                  >
                    {report.title}
                  </Link>
                  <StatusBadge type="status" value={report.status} />
                  <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/60">
                    {report.buildId?.version || 'Build'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{report.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Session: {report.sessionId?.title || 'Session'}</span>
                  <span>•</span>
                  <span>Tester: {report.testerId?.name || 'Tester'}</span>
                  <span>•</span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {(isDeveloper || isStudioAdmin) && (
                  <Link
                    to={`/duplicates?reportId=${report._id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-900/80 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicates</span>
                  </Link>
                )}
                <Link
                  to={`/feedback/${report._id}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
