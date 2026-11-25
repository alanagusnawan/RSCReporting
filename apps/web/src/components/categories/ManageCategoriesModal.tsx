'use client';

import React, { useState } from 'react';
import { X, Tag, Plus, Edit2, Trash2, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface CategoryItem {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  onRefresh: () => void;
}

export function ManageCategoriesModal({ isOpen, onClose, categories, onRefresh }: Props) {
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      if (res.ok) {
        setNewCatName('');
        onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.message || 'Gagal menambahkan kategori');
      }
    } catch {
      setError('Koneksi server gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditingName('');
        onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.message || 'Gagal mengubah kategori');
      }
    } catch {
      setError('Koneksi server gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"? Template yang menggunakan kategori ini tidak akan terhapus.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/categories/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
      } else {
        setError('Gagal menghapus kategori');
      }
    } catch {
      setError('Koneksi server gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0e131f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Kelola Kategori Template</h3>
              <p className="text-[11px] text-slate-400">Atur kategori laporan untuk filter dan organisasi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Add Category Input */}
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nama kategori baru..."
              disabled={loading}
              className="flex-1 px-3 py-2 bg-[#07090e] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !newCatName.trim()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </form>

          {/* List Categories */}
          <div className="border border-white/5 rounded-xl divide-y divide-white/5 max-h-64 overflow-y-auto bg-[#07090e]/60">
            {categories.map((cat) => (
              <div key={cat.id} className="p-3 flex items-center justify-between gap-2 hover:bg-white/[0.02]">
                {editingId === cat.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(cat.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-indigo-500 rounded-lg text-white outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdate(cat.id)}
                      disabled={loading}
                      className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded transition"
                      title="Simpan"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded transition"
                      title="Batal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span className="text-xs font-semibold text-slate-200">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition"
                        title="Edit Nama"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">
                Belum ada kategori yang ditambahkan
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 flex justify-end bg-black/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
