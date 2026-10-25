import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  MessageSquare,
  MessageSquarePlus,
  Copy,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
  Calendar,
  User,
  Clock,
  ExternalLink
} from 'lucide-react';

export const FeedbackWorkspacePage = () => {
  const [searchParams] = useSearchParams();
  const initialReportId = searchParams.get('reportId');
  const { activeStudio, builds, sessions, isDeveloper } = useStudio();

  // Active Tab: 'feed', 'submit', 'duplicates'
  const [activeTab, setActiveTab] = useState(initialReportId ? 'duplicates' : 'feed');

  // FEED STATE
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [filterBuild, setFilterBuild] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  // SUBMIT FORM STATE
  const [submitBuildId, setSubmitBuildId] = useState('');
  const [submitSessionId, setSubmitSessionId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [consentGranted, setConsentGranted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // DUPLICATE REVIEW STATE
  const [targetReportId, setTargetReportId] = useState(initialReportId || '');
  const [reviewData, setReviewData] = useState(null);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);

  const [error, setError] = useState('');

  // Sync initial build/session
  useEffect(() => {
    if (!submitBuildId && builds.length > 0) setSubmitBuildId(builds[0]._id);
    if (!submitSessionId && sessions.length > 0) setSubmitSessionId(sessions[0]._id);
  }, [builds, sessions]);

  // Load Feedback Reports
  const loadReports = async () => {
    if (!activeStudio?._id) return;
    try {
      setLoadingReports(true);
      const res = await api.listFeedback(activeStudio._id, {
        ...(filterBuild ? { buildId: filterBuild } : {}),
        ...(filterSession ? { sessionId: filterSession } : {})
      });
      const list = res.reports || [];
      setReports(list);
      if (!selectedReport && list.length > 0) {
        setSelectedReport(list[0]);
      }
      if (!targetReportId && list.length > 0) {
        setTargetReportId(list[0]._id);
      }
    } catch (err) {
      console.warn('Error loading reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [activeStudio?._id, filterBuild, filterSession]);

  // Load Duplicates for targetReportId
  const loadDuplicates = async (repId) => {
    if (!activeStudio?._id || !repId) return;
    try {
      setLoadingDuplicates(true);
      setError('');
      setDecisionSuccess('');
      const res = await api.getDuplicateCandidates(activeStudio._id, repId);
      setReviewData(res);
    } catch (err) {
      setError(err.message || 'Failed to calculate semantic duplicates.');
      setReviewData(null);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'duplicates' && targetReportId) {
      loadDuplicates(targetReportId);
    }
  }, [activeTab, targetReportId, activeStudio?._id]);

  // Submit Feedback Handler
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!submitBuildId || !submitSessionId || !title || !description) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await api.submitFeedback({
        buildId: submitBuildId,
        sessionId: submitSessionId,
        title,
        description,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        consentGranted
      });
      setSubmitSuccess(res);
      await loadReports();
    } catch (err) {
      setError(err.message || 'Failed to submit feedback report.');
    } finally {
      setSubmitting(false);
    }
  };

  // Decision Handler
  const handleDecision = async (candidateId, decisionStatus, similarityScore) => {
    try {
      setDecisionLoading(true);
      setDecisionSuccess('');
      await api.reviewDuplicateDecision({
        studioId: activeStudio._id,
        sourceReportId: targetReportId,
        targetId: candidateId,
        targetType: 'report',
        decisionStatus,
        similarityScore,
        decisionReason: `Developer confirmed ${decisionStatus} from workspace.`
      });

      setDecisionSuccess(`Candidate marked as ${decisionStatus}. Original texts preserved.`);
      await loadDuplicates(targetReportId);
      await loadReports();
    } catch (err) {
      setError(err.message || 'Failed to record duplicate decision.');
    } finally {
      setDecisionLoading(false);
    }
  };

  const filteredReports = reports.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return r.title.toLowerCase().includes(term) || r.description.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Workspace Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-cyan-400" />
            <span>Feedback & Semantic Duplicate Workspace</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit observations, review the incoming feed, and evaluate side-by-side vector duplicate matches.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'feed'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Feedback Feed ({reports.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('submit');
              setSubmitSuccess(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'submit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Submit Observation</span>
          </button>

          {isDeveloper && (
            <button
              onClick={() => setActiveTab('duplicates')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'duplicates'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span>Duplicate Review</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: FEED & DETAIL VIEW */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3 text-xs">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reports by keyword or problem..."
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
                <option key={b._id} value={b._id}>{b.version} ({b.buildName})</option>
              ))}
            </select>

            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Sessions</option>
              {sessions.map(s => (
                <option key={s._id} value={s._id}>{s.title} ({s.accessCode})</option>
              ))}
            </select>
          </div>

          {/* Master-Detail Split Grid */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Reports List */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {loadingReports ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading reports...</div>
              ) : filteredReports.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-500">
                  No feedback reports found.
                </div>
              ) : (
                filteredReports.map(rep => {
                  const isSelected = selectedReport?._id === rep._id;
                  return (
                    <div
                      key={rep._id}
                      onClick={() => setSelectedReport(rep)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-800/90 border-indigo-500 shadow-md'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-slate-200 text-xs truncate flex-1">
                          {rep.title}
                        </h3>
                        <StatusBadge type="status" value={rep.status} />
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {rep.description}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono">
                        <span>{rep.buildId?.version || 'Build'}</span>
                        <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right 7 Cols: Selected Report Details & Action Strip */}
            <div className="lg:col-span-7">
              {selectedReport ? (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
                  <div className="border-b border-slate-800 pb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                          {selectedReport.buildId?.version}
                        </span>
                        <StatusBadge type="status" value={selectedReport.status} />
                      </div>
                      <h2 className="text-lg font-bold text-white tracking-tight">{selectedReport.title}</h2>
                    </div>

                    {isDeveloper && (
                      <button
                        onClick={() => {
                          setTargetReportId(selectedReport._id);
                          setActiveTab('duplicates');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg text-xs font-semibold shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Inspect Duplicates</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {selectedReport.testerId?.name || 'Tester'}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Session: {selectedReport.sessionId?.title}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Original Problem Description
                    </div>
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selectedReport.description}
                    </div>
                  </div>

                  {selectedReport.stepsToReproduce && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Steps to Reproduce
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap">
                        {selectedReport.stepsToReproduce}
                      </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    {selectedReport.expectedBehavior && (
                      <div>
                        <span className="font-semibold text-emerald-400 block mb-1">Expected Behavior</span>
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-slate-300">
                          {selectedReport.expectedBehavior}
                        </div>
                      </div>
                    )}
                    {selectedReport.actualBehavior && (
                      <div>
                        <span className="font-semibold text-rose-400 block mb-1">Actual Behavior</span>
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-slate-300">
                          {selectedReport.actualBehavior}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-500">
                  Select an observation from the left to view details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBMIT OBSERVATION */}
      {activeTab === 'submit' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {submitSuccess ? (
            <div className="p-6 bg-slate-900 border border-emerald-900/80 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <CheckCircle2 className="w-5 h-5" />
                <span>Observation Successfully Recorded</span>
              </div>
              <p className="text-xs text-slate-300">
                Your report <strong>"{submitSuccess.report?.title}"</strong> has been saved and indexed with real vector embeddings.
              </p>

              {submitSuccess.duplicateDiscovery?.results?.length > 0 && (
                <div className="p-4 bg-slate-950 rounded-xl border border-amber-900/60 space-y-2 text-xs">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Copy className="w-4 h-4" />
                    <span>Instant Semantic Duplicate Candidates Detected!</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Identified {submitSuccess.duplicateDiscovery.results.length} existing reports sharing similar meaning.
                  </p>
                  <button
                    onClick={() => {
                      setTargetReportId(submitSuccess.report._id);
                      setActiveTab('duplicates');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold hover:underline pt-1"
                  >
                    <span>Inspect Candidates Side by Side &rarr;</span>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSubmitSuccess(null);
                    setTitle('');
                    setDescription('');
                    setStepsToReproduce('');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Submit Another Observation
                </button>
                <button
                  onClick={() => setActiveTab('feed')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Return to Feed
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Build *</label>
                  <select
                    value={submitBuildId}
                    onChange={(e) => setSubmitBuildId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {builds.map(b => (
                      <option key={b._id} value={b._id}>{b.buildName} ({b.version})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Playtest Session *</label>
                  <select
                    value={submitSessionId}
                    onChange={(e) => setSubmitSessionId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {sessions.map(s => (
                      <option key={s._id} value={s._id}>{s.title} ({s.accessCode})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observation Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cannot open inventory during tutorial"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Problem / Friction Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what occurred in your own words..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Steps to Reproduce</label>
                <textarea
                  rows={3}
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  placeholder="1. Finish prologue room&#10;2. Pick up item&#10;3. Try opening inventory..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Expected Behavior</label>
                  <textarea
                    rows={2}
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                    placeholder="What did you expect?"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Actual Behavior</label>
                  <textarea
                    rows={2}
                    value={actualBehavior}
                    onChange={(e) => setActualBehavior(e.target.value)}
                    placeholder="What actually occurred?"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Generating Embeddings & Saving...' : 'Submit Observation'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: SIDE-BY-SIDE DUPLICATE REVIEW */}
      {activeTab === 'duplicates' && (
        <div className="space-y-6">
          {/* Target Selector Toolbar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Target Anchor Report:</span>
              <select
                value={targetReportId}
                onChange={(e) => setTargetReportId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 max-w-sm truncate"
              >
                {reports.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.title} ({r.buildId?.version})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Original text is strictly preserved. Linking does not delete.</span>
            </div>
          </div>

          {decisionSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-900 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{decisionSuccess}</span>
            </div>
          )}

          {loadingDuplicates ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Calculating cosine vector similarities across reports...
            </div>
          ) : !reviewData ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-500">
              Select an anchor report to inspect semantic duplicate candidates.
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column: Anchor Report */}
              <div className="p-5 bg-slate-900 border-2 border-indigo-500/50 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Target Report (Anchor)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(reviewData.originalReport.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{reviewData.originalReport.title}</h3>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {reviewData.originalReport.description}
                </div>

                {reviewData.originalReport.stepsToReproduce && (
                  <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="font-semibold text-slate-300 block mb-0.5">Steps to Reproduce:</span>
                    {reviewData.originalReport.stepsToReproduce}
                  </div>
                )}
              </div>

              {/* Right Column: Candidates */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Candidate Matches ({reviewData.candidates.length})</span>
                  <span className="text-[11px] text-slate-500 font-mono">Engine: {reviewData.engine}</span>
                </div>

                {reviewData.candidates.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-500">
                    No candidates exceeded the similarity threshold in this build.
                  </div>
                ) : (
                  reviewData.candidates.map((cand, idx) => {
                    const matchPct = (cand.similarityScore * 100).toFixed(1);
                    const isAccepted = cand.existingDecision?.status === 'accepted';
                    const isDismissed = cand.existingDecision?.status === 'dismissed';

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isAccepted
                            ? 'bg-emerald-950/20 border-emerald-800'
                            : isDismissed
                            ? 'bg-slate-950/40 border-slate-800 opacity-60'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-bold text-slate-200 text-xs flex-1">{cand.report.title}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold border shrink-0 ${
                              cand.similarityScore >= 0.80
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border-amber-800'
                            }`}
                          >
                            {matchPct}% match
                          </span>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed mb-3">
                          {cand.report.description}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <div>
                            {isAccepted && (
                              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Accepted Duplicate
                              </span>
                            )}
                            {isDismissed && (
                              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> Dismissed as Separate
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={decisionLoading}
                              onClick={() => handleDecision(cand.report._id, 'dismissed', cand.similarityScore)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                            >
                              Dismiss
                            </button>
                            <button
                              type="button"
                              disabled={decisionLoading}
                              onClick={() => handleDecision(cand.report._id, 'accepted', cand.similarityScore)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-xs transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Confirm Link</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
