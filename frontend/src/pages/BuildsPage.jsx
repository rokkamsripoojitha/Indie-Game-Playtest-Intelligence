import React, { useState, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  FolderGit2,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';

export const BuildsPage = () => {
  const { activeStudio, builds, refreshBuilds, isDeveloper, isStudioAdmin } = useStudio();
  const [showModal, setShowModal] = useState(false);
  const [buildName, setBuildName] = useState('');
  const [version, setVersion] = useState('');
  const [status, setStatus] = useState('active');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [engine, setEngine] = useState('Unity 2023 LTS');
  const [targetPlatform, setTargetPlatform] = useState('PC / Windows');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateBuild = async (e) => {
    e.preventDefault();
    if (!buildName || !version) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.createBuild({
        studioId: activeStudio._id,
        buildName,
        version,
        status,
        releaseNotes,
        metadata: { engine, targetPlatform }
      });
      setSuccess(res.message);
      setShowModal(false);
      setBuildName('');
      setVersion('');
      setReleaseNotes('');
      await refreshBuilds();
    } catch (err) {
      setError(err.message || 'Failed to create game build.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-indigo-400" />
            <span>Game Build Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Register and manage executable versions. Feedback and RAG documentation strictly isolate to these builds.
          </p>
        </div>

        {(isDeveloper || isStudioAdmin) && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Build</span>
          </button>
        )}
      </div>

      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-900 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Builds Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {builds.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 md:col-span-2">
            No game builds registered for this studio yet.
          </div>
        ) : (
          builds.map(b => (
            <div
              key={b._id}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-base">{b.buildName}</h3>
                    <span className="font-mono text-xs text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-900">
                      {b.version}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Platform: {b.metadata?.targetPlatform || 'PC'} &bull; Engine: {b.metadata?.engine || 'Unity'}
                  </div>
                </div>
                <StatusBadge type="status" value={b.status} />
              </div>

              {b.releaseNotes && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  {b.releaseNotes}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2 font-mono">
                <span>ID: {b._id}</span>
                <span>Registered: {new Date(b.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-indigo-400" />
              <span>Register New Game Build</span>
            </h2>

            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBuild} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Build Name *</label>
                  <input
                    type="text"
                    required
                    value={buildName}
                    onChange={(e) => setBuildName(e.target.value)}
                    placeholder="e.g. Project ChronoShift Beta"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Version String *</label>
                  <input
                    type="text"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. v1.0.2-beta"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Game Engine</label>
                  <input
                    type="text"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Platform</label>
                  <input
                    type="text"
                    value={targetPlatform}
                    onChange={(e) => setTargetPlatform(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Release Notes / Scope</label>
                <textarea
                  rows={3}
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="Notes on what features or levels are testable in this build..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  {loading ? 'Creating...' : 'Register Build'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
