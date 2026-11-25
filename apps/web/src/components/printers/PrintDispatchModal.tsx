'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, RefreshCw, AlertCircle, CheckCircle2, Cpu, Plus } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface AgentItem {
  agentId: string;
  name: string;
  displayName?: string;
  hostname?: string;
  status: 'online' | 'offline';
  printers: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (agentId: string, printerId: string, copies: number) => Promise<void>;
  loading: boolean;
  onOpenRegisterModal: () => void;
}

export function PrintDispatchModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  onOpenRegisterModal,
}: Props) {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [copies, setCopies] = useState<number>(1);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAgents();
      setError(null);
    }
  }, [isOpen]);

  const loadAgents = async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/printers/agents`);
      if (res.ok) {
        const data: AgentItem[] = await res.json();
        setAgents(data);
        const onlineWithPrinters = data.find((a) => a.status === 'online' && a.printers.length > 0);
        const defaultAgent = onlineWithPrinters || data.find((a) => a.status === 'online') || data[0];
        if (defaultAgent) {
          setSelectedAgentId(defaultAgent.agentId);
          if (defaultAgent.printers.length > 0) {
            setSelectedPrinter(defaultAgent.printers[0]);
          } else {
            setSelectedPrinter('');
          }
        }
      } else {
        setError('Gagal mengambil daftar agent.');
      }
    } catch {
      setError('Koneksi ke backend server gagal.');
    } finally {
      setFetching(false);
    }
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    const agent = agents.find((a) => a.agentId === agentId);
    if (agent && agent.printers.length > 0) {
      setSelectedPrinter(agent.printers[0]);
    } else {
      setSelectedPrinter('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) {
      setError('Pilih Print Agent terlebih dahulu.');
      return;
    }
    if (!selectedPrinter) {
      setError('Pilih Printer tujuan cetak.');
      return;
    }
    await onConfirm(selectedAgentId, selectedPrinter, copies);
  };

  if (!isOpen) return null;

  const currentAgent = agents.find((a) => a.agentId === selectedAgentId);
  const printers = currentAgent?.printers || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0e131f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Generate & Dispatch Print</h3>
              <p className="text-[11px] text-slate-400">Pilih workstation agent dan target printer fisik</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-rose-300 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Pilih Agent */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Print Agent</label>
              <button
                type="button"
                onClick={loadAgents}
                disabled={fetching || loading}
                className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono"
              >
                <RefreshCw className={`w-3 h-3 ${fetching ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
            <select
              value={selectedAgentId}
              onChange={(e) => handleAgentChange(e.target.value)}
              disabled={fetching || loading || agents.length === 0}
              className="w-full bg-[#07090e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              {agents.length === 0 ? (
                <option value="">Tidak ada agent terdaftar</option>
              ) : (
                agents.map((a) => (
                  <option key={a.agentId} value={a.agentId}>
                    {a.name || a.displayName || a.hostname} [{a.status.toUpperCase()}] ({a.printers.length} printer)
                  </option>
                ))
              )}
            </select>
            {currentAgent && (
              <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    currentAgent.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span className="text-slate-400">
                  Host: <strong className="text-slate-200">{currentAgent.hostname || '-'}</strong>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">ID: {currentAgent.agentId.slice(0, 8)}...</span>
              </div>
            )}
          </div>

          {/* Pilih Printer */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Printer Destination</label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegisterModal();
                }}
                className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Printer</span>
              </button>
            </div>
            {printers.length === 0 ? (
              <div className="p-4 bg-[#07090e] border border-white/10 rounded-xl text-center">
                <p className="text-xs text-slate-400 mb-2">Belum ada printer terdeteksi pada agent ini.</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRegisterModal();
                  }}
                  className="px-3.5 py-1.5 text-xs bg-sky-500/10 text-sky-300 border border-sky-500/30 rounded-full hover:bg-sky-500/20 transition"
                >
                  Daftarkan Printer Baru
                </button>
              </div>
            ) : (
              <select
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                disabled={loading}
                className="w-full bg-[#07090e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                {printers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Copies */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Number of Copies
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
              disabled={loading}
              className="w-24 bg-[#07090e] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !selectedAgentId || !selectedPrinter}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Dispatching...' : 'Dispatch Print Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
