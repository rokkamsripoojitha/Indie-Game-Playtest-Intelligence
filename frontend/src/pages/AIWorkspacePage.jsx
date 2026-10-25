import React, { useState, useEffect, useRef } from 'react';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { AgentTracePanel } from '../components/AgentTracePanel';
import { StatusBadge } from '../components/StatusBadge';
import {
  Bot,
  Sparkles,
  BookOpen,
  Send,
  HelpCircle,
  Play,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Layers,
  Database,
  Hash,
  Upload,
  Cpu,
  User
} from 'lucide-react';

export const AIWorkspacePage = () => {
  const { activeStudio, builds, isDeveloper } = useStudio();
  const [activeTab, setActiveTab] = useState('agent'); // 'agent' or 'rag'

  // AGENT STATE
  const [agentBuildId, setAgentBuildId] = useState(builds[0]?._id || '');
  const [topic, setTopic] = useState('Tutorial Inventory');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentResult, setAgentResult] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState('');

  // RAG CHAT STATE
  const [chatBuildId, setChatBuildId] = useState(builds[0]?._id || '');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your Build QA Assistant. Ask me questions about controls, game configuration, known issues, or troubleshooting for your active build.',
      citations: []
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // RAG DOCUMENTS STATE
  const [documents, setDocuments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSourceType, setUploadSourceType] = useState('guide');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  const [error, setError] = useState('');

  // Sync builds if loaded later
  useEffect(() => {
    if (!agentBuildId && builds.length > 0) setAgentBuildId(builds[0]._id);
    if (!chatBuildId && builds.length > 0) setChatBuildId(builds[0]._id);
  }, [builds]);

  // Load Documents for RAG
  const loadDocuments = async () => {
    if (!activeStudio?._id) return;
    try {
      const res = await api.listDocuments(activeStudio._id, chatBuildId);
      setDocuments(res.documents || []);
    } catch (err) {
      console.warn('Error loading documents:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'rag') {
      loadDocuments();
    }
  }, [activeTab, chatBuildId, activeStudio?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Agent Run Handler
  const handleRunInvestigation = async (e) => {
    e?.preventDefault();
    if (!agentBuildId || !activeStudio?._id) return;

    setAgentLoading(true);
    setError('');
    setApprovalSuccess('');
    setAgentResult(null);

    try {
      const res = await api.investigateTopic({
        studioId: activeStudio._id,
        buildId: agentBuildId,
        topic
      });
      setAgentResult(res);
    } catch (err) {
      setError(err.message || 'Investigation agent execution failed.');
    } finally {
      setAgentLoading(false);
    }
  };

  // Agent Approve Proposal Handler
  const handleApproveProposal = async () => {
    if (!agentResult || !agentResult.cluster) return;
    setApprovalLoading(true);
    setError('');
    setApprovalSuccess('');

    try {
      const reportIds = agentResult.cluster.reports.map(r => r._id);
      const res = await api.approveProposalIssue({
        studioId: activeStudio._id,
        buildId: agentBuildId,
        title: agentResult.investigationTitle,
        description: `Identified by AI Agent Pre-Playtest Investigation.\n\n[Known Facts]:\n${agentResult.evidence?.knownFacts?.join('\n')}\n\n[Hypotheses]:\n${agentResult.evidence?.hypotheses?.join('\n')}\n\n[Missing Reproduction Details]:\n${agentResult.evidence?.missingReproductionDetails}`,
        severity: 'high',
        evidenceReportIds: reportIds,
        suggestedFollowUpTest: agentResult.evidence?.suggestedFollowUpTest
      });

      setApprovalSuccess(res.message);
    } catch (err) {
      setError(err.message || 'Failed to approve proposal and create issue.');
    } finally {
      setApprovalLoading(false);
    }
  };

  // RAG Chat Send Handler
  const handleSendChat = async (qText = chatInput) => {
    const text = qText.trim();
    if (!text || !chatBuildId || !activeStudio?._id) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setChatInput('');
    setChatLoading(true);
    setError('');

    try {
      const res = await api.askQuestion({
        studioId: activeStudio._id,
        buildId: chatBuildId,
        question: text
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          citations: res.citations || [],
          grounded: res.grounded,
          buildVersion: res.buildVersion
        }
      ]);
    } catch (err) {
      setError(err.message || 'Failed to query build documentation.');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while querying build documentation.',
          citations: []
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Upload Document Handler
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!chatBuildId || !uploadTitle || !uploadContent) return;
    setUploadLoading(true);
    setError('');

    try {
      await api.uploadDocument({
        studioId: activeStudio._id,
        buildId: chatBuildId,
        title: uploadTitle,
        sourceType: uploadSourceType,
        content: uploadContent
      });
      setShowUploadModal(false);
      setUploadTitle('');
      setUploadContent('');
      await loadDocuments();
    } catch (err) {
      setError(err.message || 'Failed to upload and index document.');
    } finally {
      setUploadLoading(false);
    }
  };

  const sampleQuestions = [
    'How do I open my inventory?',
    'What are the known issues in this build?',
    'Which graphics settings are recommended?',
    'What are the keyboard controls for movement?'
  ];

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span>AI Intelligence & RAG Workspace</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Orchestrate the 3-tool pre-playtest agent and query build documentation with citations.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'agent'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-300" />
            <span>Pre-Playtest Agent</span>
          </button>

          <button
            onClick={() => setActiveTab('rag')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'rag'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-300" />
            <span>Build QA & Docs (RAG)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: PRE-PLAYTEST INVESTIGATION AGENT */}
      {activeTab === 'agent' && (
        <div className="space-y-6">
          {/* Agent Parameters Card */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                  Capstone AI Agent
                </span>
                <h2 className="text-base font-bold text-white mt-1">
                  "What should we investigate before the next playtest?"
                </h2>
              </div>
              <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
                Sequence: findFeedback &rarr; readIssueState &rarr; countAffectedSessions
              </div>
            </div>

            <form onSubmit={handleRunInvestigation} className="grid sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Build *</label>
                <select
                  value={agentBuildId}
                  onChange={(e) => setAgentBuildId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {builds.map(b => (
                    <option key={b._id} value={b._id}>{b.version} ({b.buildName})</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Investigation Scope / Topic *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Tutorial Inventory, Graphics Crash, Combat Controls"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={agentLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{agentLoading ? 'Orchestrating...' : 'Run Agent'}</span>
                  </button>
                </div>
              </div>
            </form>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 flex-wrap">
              <span className="text-slate-500">Demo Prompts:</span>
              <button
                type="button"
                onClick={() => setTopic('Tutorial Inventory')}
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-indigo-300 font-mono"
              >
                "Tutorial Inventory"
              </button>
              <button
                type="button"
                onClick={() => setTopic('Graphics Quality Crash')}
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-indigo-300 font-mono"
              >
                "Graphics Quality Crash"
              </button>
              <button
                type="button"
                onClick={() => setTopic('Multiplayer Netcode')}
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-indigo-300 font-mono"
              >
                "Multiplayer Netcode (Empty Test)"
              </button>
            </div>
          </div>

          {approvalSuccess && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-900 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <strong>Developer Action Recorded: </strong>
                <span>{approvalSuccess}</span>
              </div>
            </div>
          )}

          {/* Agent Results Display */}
          {agentResult && (
            <div className="space-y-6">
              {/* Tool Execution Trace */}
              <AgentTracePanel
                traces={agentResult.executionTrace}
                totalMs={agentResult.totalExecutionMs}
              />

              {agentResult.status === 'no_data' ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-2">
                  <div className="font-semibold text-amber-300 text-sm">Graceful Missing Data Response</div>
                  <p>{agentResult.message}</p>
                </div>
              ) : (
                <div className="p-6 bg-slate-900 border border-indigo-900/60 rounded-2xl shadow-xl space-y-6">
                  {/* Header & Metrics */}
                  <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 uppercase">
                          Evidence Proposal Synthesized
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Build {agentResult.scope?.buildVersion}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        {agentResult.investigationTitle}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500 uppercase">Frequency</div>
                        <div className="font-bold text-purple-300 text-sm">
                          {agentResult.metrics?.distinctAffectedSessions} Distinct Sessions
                        </div>
                      </div>
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500 uppercase">Reports</div>
                        <div className="font-bold text-cyan-300 text-sm">
                          {agentResult.metrics?.totalReports} Reports
                        </div>
                      </div>
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500 uppercase">Confidence</div>
                        <div className="font-bold text-emerald-300 text-sm">
                          {agentResult.metrics?.clusterConfidenceScore} Score
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Facts vs Hypotheses */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Known Facts (Verified Data)</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {agentResult.evidence?.knownFacts?.map((fact, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-500 shrink-0">&bull;</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        <span>Hypotheses (Requires Verification)</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {agentResult.evidence?.hypotheses?.map((hyp, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-500 shrink-0">&bull;</span>
                            <span>{hyp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Missing Reproduction Details */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-0.5">
                      Missing Reproduction Information:
                    </span>
                    <span className="text-slate-300">{agentResult.evidence?.missingReproductionDetails}</span>
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 bg-indigo-950/40 border border-indigo-900/60 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-indigo-300 block">
                      Suggested Follow-Up Test for Next Playtest:
                    </span>
                    <p className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 leading-relaxed font-medium">
                      {agentResult.evidence?.suggestedFollowUpTest}
                    </p>
                  </div>

                  {/* Clustered Reports Excerpts */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Supporting Clustered Reports ({agentResult.cluster?.reports?.length || 0})
                    </span>
                    <div className="grid gap-2">
                      {agentResult.cluster?.reports?.map((r, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-200">{r.title}</div>
                            <p className="text-slate-400 italic">"{r.description}"</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-950 border border-cyan-800 shrink-0">
                            {(r.similarityScore * 100).toFixed(1)}% match
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Human Approval Sign-off */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>The agent proposes insights only. Human developers retain exclusive issue-creation authority.</span>
                    </div>

                    {isDeveloper && (
                      <button
                        type="button"
                        onClick={handleApproveProposal}
                        disabled={approvalLoading}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{approvalLoading ? 'Creating Issue...' : 'Approve & Create Confirmed Issue'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BUILD DOCUMENTATION & GROUNDED RAG CHAT */}
      {activeTab === 'rag' && (
        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-14rem)]">
          {/* Left 4 Cols: Document Indexer */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>Indexed Docs</span>
              </div>

              {isDeveloper && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="p-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1"
                  title="Upload Document"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-1">
              <span>Scoped Build:</span>
              <select
                value={chatBuildId}
                onChange={(e) => setChatBuildId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-200 font-mono text-[11px]"
              >
                {builds.map(b => (
                  <option key={b._id} value={b._id}>{b.version}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
              {documents.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No documents indexed for this build.
                </div>
              ) : (
                documents.map(doc => (
                  <div key={doc._id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="font-semibold text-slate-200 truncate">{doc.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{doc.chunks?.length || 0} chunks</span>
                      <span className="capitalize">{doc.sourceType}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right 8 Cols: Grounded Q&A Chat */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>Grounded Setup Q&A Assistant</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Isolated to Build {builds.find(b => b._id === chatBuildId)?.version || 'Active'}
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-lg rounded-2xl p-3.5 space-y-2 leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-sm shadow'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1.5">
                        <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          <span>Citations ({msg.citations.length})</span>
                        </div>
                        {msg.citations.map((c, cIdx) => (
                          <div key={cIdx} className="p-2 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-300 space-y-0.5">
                            <div className="font-semibold text-indigo-400">{c.title} (Build {c.buildVersion})</div>
                            <p className="text-slate-400 italic">"{c.excerpt}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                  <span>Retrieving build chunks and synthesizing answer...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips */}
            <div className="py-2 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 border-t border-slate-800/60 mt-2">
              <span className="text-slate-500">Quick:</span>
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(q)}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-full text-slate-300 whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-center gap-2 pt-2 shrink-0"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about build setup, controls, or known issues..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Index Build Documentation</span>
            </h2>

            <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Build</label>
                  <select
                    value={chatBuildId}
                    onChange={(e) => setChatBuildId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {builds.map(b => (
                      <option key={b._id} value={b._id}>{b.version}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Source Type</label>
                  <select
                    value={uploadSourceType}
                    onChange={(e) => setUploadSourceType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="guide">Player Guide / Controls</option>
                    <option value="troubleshooting">Troubleshooting Notes</option>
                    <option value="known_issues">Known Issues</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Keyboard & Gamepad Setup Manual"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Content Text *</label>
                <textarea
                  required
                  rows={6}
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="Paste manual or release notes text to be chunked and embedded..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  {uploadLoading ? 'Indexing...' : 'Index Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
