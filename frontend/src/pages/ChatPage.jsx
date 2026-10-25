import React, { useState, useEffect, useRef } from 'react';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import {
  HelpCircle,
  Send,
  Bot,
  User,
  BookOpen,
  Sparkles,
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export const ChatPage = () => {
  const { activeStudio, builds } = useStudio();
  const [selectedBuildId, setSelectedBuildId] = useState(builds[0]?._id || '');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your Build QA Assistant. Ask me questions about controls, game configuration, known issues, or troubleshooting for your active build.',
      citations: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!selectedBuildId && builds.length > 0) {
      setSelectedBuildId(builds[0]._id);
    }
  }, [builds]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (questionText = input) => {
    const text = questionText.trim();
    if (!text || !selectedBuildId || !activeStudio?._id) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await api.askQuestion({
        studioId: activeStudio._id,
        buildId: selectedBuildId,
        question: text
      });

      const assistantMsg = {
        role: 'assistant',
        content: res.answer,
        citations: res.citations || [],
        grounded: res.grounded,
        buildVersion: res.buildVersion
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message || 'Failed to retrieve answer from build documentation.');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while querying build documentation. Please try again.',
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    'How do I open my inventory?',
    'What are the known issues in this build?',
    'Which graphics settings are recommended?',
    'What are the keyboard controls for movement?'
  ];

  const currentBuild = builds.find(b => b._id === selectedBuildId);

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      {/* Top Header & Build Scoping Selector */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-400" />
            <span>Build QA Assistant (Grounded RAG)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Answers are grounded strictly in the selected build's official documentation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Scoped Build:</span>
          <select
            value={selectedBuildId}
            onChange={(e) => setSelectedBuildId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
          >
            {builds.map(b => (
              <option key={b._id} value={b._id}>
                {b.version} ({b.buildName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 text-xs leading-relaxed ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-xl rounded-2xl p-4 space-y-3 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm shadow-md'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Citations Box */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Verifiable Source Citations ({msg.citations.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {msg.citations.map((cite, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-400 font-semibold">
                          <span>{cite.title}</span>
                          <span className="font-mono text-indigo-400">Build {cite.buildVersion}</span>
                        </div>
                        <p className="text-slate-400 italic">"{cite.excerpt}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            <span>Retrieving chunks and synthesizing grounded answer...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="pt-3 pb-2 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
        <span className="text-slate-400 text-[11px] shrink-0">Suggested:</span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full text-slate-300 text-[11px] transition-colors whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pt-2 border-t border-slate-800 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about Build ${currentBuild?.version || ''} setup, controls, or known issues...`}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-md shadow-indigo-600/30"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
