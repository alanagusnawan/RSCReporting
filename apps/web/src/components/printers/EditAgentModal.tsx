'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit2, RefreshCw, AlertCircle, Laptop } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agent: {
    agentId: string;
    name: string;
    hostname?: string;
  } | null;
  onSuccess?: () => void;
}

export function EditAgentModal({ isOpen, onClose, agent, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agent) {
      setName(agent.name || '');
      setError(null);
    }
  }, [agent]);

  if (!isOpen || !agent) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama Agent tidak boleh kosong.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/printers/agents/${agent.agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.message || 'Gagal mengubah nama Agent.');
      }
    } catch {
      setError('Koneksi ke backend server gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EAF0FF] text-[#2F6BFF] border border-[#BFDBFE] flex items-center justify-center">
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Edit Workstation Agent</h3>
              <p className="text-xs text-[#6B7280]">Host: {agent.hostname || '-'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Display Name / Lokasi Workstation
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kasir Utama Depan atau PC Farmasi 1"
              disabled={submitting}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] focus:border-[#2F6BFF] outline-none"
              required
            />
            <span className="text-[11px] text-[#6B7280] mt-1 block">
              Nama ini akan tampil pada pilihan dropdown saat mencetak dokumen.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Agent UUID (Read-only)</label>
            <input
              type="text"
              value={agent.agentId}
              disabled
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#6B7280] font-mono cursor-not-allowed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-[#6B7280] hover:text-[#111827] rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-5 py-2 text-xs font-semibold bg-[#2F6BFF] hover:bg-[#1F55E0] text-white rounded-lg transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
