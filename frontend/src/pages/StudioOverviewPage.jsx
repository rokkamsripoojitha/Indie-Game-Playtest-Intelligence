import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';
import {
  Building2,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

export const StudioOverviewPage = () => {
  const { studios, activeStudio, setActiveStudio, refreshStudios } = useStudio();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateStudio = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.createStudio({ name: name.trim(), description });
      setSuccess(`Studio "${res.studio.name}" created successfully. You are the Studio Admin.`);
      setShowModal(false);
      setName('');
      setDescription('');
      await refreshStudios();
    } catch (err) {
      setError(err.message || 'Failed to create studio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <span>Studio Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your game studios, workspaces, and team authorizations.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Studio</span>
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-900 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Studios List */}
      <div className="grid md:grid-cols-2 gap-4">
        {studios.map(s => {
          const isCurrent = activeStudio?._id === s._id;
          return (
            <div
              key={s._id}
              className={`p-5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-indigo-950/20 border-indigo-500/80 shadow-lg'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-bold text-slate-100 text-base">{s.name}</h3>
                  <div className="text-[11px] text-indigo-400 capitalize mt-0.5">
                    Role: {s.myRole?.replace('_', ' ')}
                  </div>
                </div>
                {isCurrent ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => setActiveStudio(s)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                  >
                    Switch
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                {s.description || 'No description provided.'}
              </p>

              <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 font-mono">
                Studio ID: {s._id}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Create New Game Studio</span>
            </h2>

            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateStudio} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Studio Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Moonlight Interactive"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Studio description, game genre, target platforms..."
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
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Studio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
