import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  FileText,
  Copy,
  Calendar,
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  User,
  Clock
} from 'lucide-react';

export const FeedbackDetailPage = () => {
  const { reportId } = useParams();
  const { activeStudio, isDeveloper, isStudioAdmin } = useStudio();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDetail = async () => {
      if (!activeStudio?._id || !reportId) return;
      try {
        setLoading(true);
        const res = await api.getFeedbackById(activeStudio._id, reportId);
        setReport(res.report);
      } catch (err) {
        setError(err.message || 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [activeStudio?._id, reportId]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading observation details...</div>;
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="text-rose-400 font-semibold text-sm">Failed to load report</div>
        <p className="text-xs text-slate-400">{error || 'Report not found or access restricted.'}</p>
        <Link to="/feedback" className="inline-block text-xs text-indigo-400 hover:underline">
          &larr; Return to Feedback Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/feedback"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feedback Feed</span>
        </Link>

        {(isDeveloper || isStudioAdmin) && (
          <Link
            to={`/duplicates?reportId=${report._id}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg text-xs font-semibold"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Review Semantic Duplicates</span>
          </Link>
        )}
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900">
              Build {report.buildId?.version || 'N/A'}
            </span>
            <StatusBadge type="status" value={report.status} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{report.title}</h1>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> {report.testerId?.name} ({report.testerId?.email})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Session: {report.sessionId?.title}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {new Date(report.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Original Description */}
        <div className="space-y-1.5">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Original Problem Description
          </h2>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            {report.description}
          </div>
        </div>

        {/* Steps to Reproduce */}
        {report.stepsToReproduce && (
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Steps to Reproduce
            </h2>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {report.stepsToReproduce}
            </div>
          </div>
        )}

        {/* Expected vs Actual */}
        <div className="grid md:grid-cols-2 gap-4">
          {report.expectedBehavior && (
            <div className="space-y-1.5">
              <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Expected Behavior
              </h2>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 whitespace-pre-wrap">
                {report.expectedBehavior}
              </div>
            </div>
          )}

          {report.actualBehavior && (
            <div className="space-y-1.5">
              <h2 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                Actual Behavior
              </h2>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 whitespace-pre-wrap">
                {report.actualBehavior}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
