import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import {
  MessageSquarePlus,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export const FeedbackSubmitPage = () => {
  const { activeStudio, builds, sessions } = useStudio();
  const navigate = useNavigate();

  const [buildId, setBuildId] = useState(builds[0]?._id || '');
  const [sessionId, setSessionId] = useState(sessions[0]?._id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [consentGranted, setConsentGranted] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);

  // Sync if builds or sessions loaded later
  React.useEffect(() => {
    if (!buildId && builds.length > 0) setBuildId(builds[0]._id);
    if (!sessionId && sessions.length > 0) setSessionId(sessions[0]._id);
  }, [builds, sessions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buildId || !sessionId) {
      setError('Please select an active build and playtest session.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.submitFeedback({
        buildId,
        sessionId,
        title,
        description,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        consentGranted
      });
      setSubmissionResult(res);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquarePlus className="w-6 h-6 text-cyan-400" />
          <span>Submit Playtest Feedback</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Provide structured observations to help the development team reproduce and triage issues.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/50 border border-rose-900 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {submissionResult ? (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-emerald-900/60 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <CheckCircle2 className="w-5 h-5" />
              <span>Report Successfully Recorded</span>
            </div>
            <p className="text-xs text-slate-300">
              Your feedback <strong>"{submissionResult.report?.title}"</strong> has been indexed with vector embeddings and safely persisted in the database.
            </p>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Embedding: {submissionResult.embeddingMetadata?.model} ({submissionResult.embeddingMetadata?.dimension} dims, {submissionResult.embeddingMetadata?.provider})
              </span>
            </div>
          </div>

          {/* Semantic Duplicate Candidate Discovery Banner */}
          {submissionResult.duplicateDiscovery?.results?.length > 0 ? (
            <div className="p-6 bg-slate-900/90 border border-amber-900/60 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Copy className="w-4 h-4" />
                  <span>Semantic Similarities Detected ({submissionResult.duplicateDiscovery.results.length} Candidates)</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Engine: {submissionResult.duplicateDiscovery.engine}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                The semantic vector engine identified existing reports with similar meaning. Reports remain separate until an authorized developer reviews and explicitly links them.
              </p>

              <div className="space-y-3">
                {submissionResult.duplicateDiscovery.results.map((candidate, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex items-start justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{candidate.report.title}</div>
                      <div className="text-slate-400 mt-1 line-clamp-2">{candidate.report.description}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-amber-300 bg-amber-950 border border-amber-800 text-xs">
                        {(candidate.similarityScore * 100).toFixed(1)}% match
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  to={`/duplicates?reportId=${submissionResult.report._id}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline"
                >
                  <span>Open Side-by-Side Review Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
              No existing duplicate candidates exceeded the semantic similarity threshold. This observation appears to be unique.
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSubmissionResult(null);
                setTitle('');
                setDescription('');
                setStepsToReproduce('');
                setExpectedBehavior('');
                setActualBehavior('');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
            >
              Submit Another Report
            </button>
            <Link
              to="/feedback"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
            >
              View All Reports
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Game Build *</label>
              <select
                value={buildId}
                onChange={(e) => setBuildId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {builds.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.buildName} ({b.version})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Playtest Session *</label>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {sessions.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.title} ({s.accessCode} - {s.feedbackSharingPolicy})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Observation Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cannot open inventory during opening tutorial"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Observed Problem / Friction Description *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred in your own words..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Steps to Reproduce (Recommended)</label>
            <textarea
              rows={3}
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="1. Start game&#10;2. Finish opening tutorial room&#10;3. Try opening inventory..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Expected Behavior</label>
              <textarea
                rows={2}
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                placeholder="What did you expect to happen?"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Actual Behavior</label>
              <textarea
                rows={2}
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                placeholder="What actually occurred?"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
            <input
              type="checkbox"
              id="consentCheck"
              checked={consentGranted}
              onChange={(e) => setConsentGranted(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="consentCheck">
              I consent to this feedback and gameplay context being indexed for semantic analysis and AI triage.
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Generating Embeddings & Submitting...' : 'Submit Feedback Report'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
