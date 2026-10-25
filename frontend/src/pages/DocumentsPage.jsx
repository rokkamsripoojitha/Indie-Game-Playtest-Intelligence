import React, { useState, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import {
  BookOpen,
  Upload,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Cpu,
  Layers,
  ChevronRight
} from 'lucide-react';

export const DocumentsPage = () => {
  const { activeStudio, builds } = useStudio();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBuild, setFilterBuild] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form
  const [buildId, setBuildId] = useState(builds[0]?._id || '');
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState('guide');
  const [content, setContent] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDocuments = async () => {
    if (!activeStudio?._id) return;
    try {
      setLoading(true);
      const res = await api.listDocuments(activeStudio._id, filterBuild);
      setDocuments(res.documents || []);
    } catch (err) {
      console.warn('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeStudio?._id, filterBuild]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!buildId || !title || !content) return;
    setUploadLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.uploadDocument({
        studioId: activeStudio._id,
        buildId,
        title,
        sourceType,
        content
      });
      setSuccess(res.message);
      setShowUploadModal(false);
      setTitle('');
      setContent('');
      await loadDocuments();
    } catch (err) {
      setError(err.message || 'Failed to upload document.');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>Build Documentation & RAG Indexing</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload setup manuals, known issues, and patch notes for build-isolated semantic question answering.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-900 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Build Filter */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400">Filter by Build:</span>
        <select
          value={filterBuild}
          onChange={(e) => setFilterBuild(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Builds</option>
          {builds.map(b => (
            <option key={b._id} value={b._id}>
              {b.version} ({b.buildName})
            </option>
          ))}
        </select>
      </div>

      {/* Documents List */}
      <div className="grid md:grid-cols-2 gap-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 md:col-span-2">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 md:col-span-2">
            No documentation uploaded for this build yet.
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc._id}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-900">
                    Build: {doc.buildId?.version || 'N/A'}
                  </span>
                  <h3 className="font-bold text-slate-100 text-sm mt-1">{doc.title}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  {doc.sourceType}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  {doc.chunks?.length || 0} Chunks Indexed
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  {doc.embeddingStatus}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                <span>Uploaded by: {doc.uploadedBy?.name || 'Developer'}</span>
                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Upload & Index Build Documentation</span>
            </h2>

            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Build *</label>
                  <select
                    value={buildId}
                    onChange={(e) => setBuildId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {builds.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.version} ({b.buildName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Source Type</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="guide">Player Guide / Controls</option>
                    <option value="troubleshooting">Troubleshooting Notes</option>
                    <option value="known_issues">Known Issues</option>
                    <option value="patch_notes">Patch Notes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Controller Configuration & Keybindings"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Document Text Content *</label>
                <textarea
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste or write the document text content here. It will be automatically chunked and embedded with vector search indices..."
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
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {uploadLoading ? 'Chunking & Embedding...' : 'Index Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
