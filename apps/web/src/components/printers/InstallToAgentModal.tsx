'use client';

import React, { useState } from 'react';
import { X, Share2, Laptop, Check, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/apiConfig';
import { StatusBadge } from '../dashboard/StatusBadge';

interface AgentItem {
  agentId: string;
  name: string;
  displayName?: string;
  hostname?: string;
  os?: string;
  status: 'online' | 'offline';
  printers: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sourceAgent: AgentItem | null;
  printerName: string;
  agents: AgentItem[];
  onSuccess: () => void;
}

export function InstallToAgentModal({
  isOpen,
  onClose,
  sourceAgent,
  printerName,
  agents,
  onSuccess,
}: Props) {
  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());
  const [targetQueueName, setTargetQueueName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{ targetAgentId: string; success: boolean; error?: string; endpointUsed?: string }> | null>(null);

  React.useEffect(() => {
    if (sourceAgent && printerName) {
      setTargetQueueName(`${sourceAgent.name || sourceAgent.hostname || 'Remote'}-${printerName.replace(/\s+/g, '_')}`);
      setSelectedTargetIds(new Set());
      setError(null);
      setResults(null);
    }
  }, [sourceAgent, printerName]);

  if (!isOpen || !sourceAgent) return null;

  // Filter agen selain diri sendiri (source)
  const candidateAgents = agents.filter((a) => a.agentId !== sourceAgent.agentId);

  const toggleTarget = (id: string) => {
    const next = new Set(selectedTargetIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTargetIds(next);
  };

  const selectAll = () => {
    setSelectedTargetIds(new Set(candidateAgents.map((a) => a.agentId)));
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTargetIds.size === 0) {
      setError('Pilih minimal satu komputer target.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/printers/install-to-agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceAgentId: sourceAgent.agentId,
          sourcePrinterName: printerName,
          targetAgentIds: Array.from(selectedTargetIds),
          targetQueueName: targetQueueName.trim() || undefined,
          isDefault,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResults(data.results || []);
        onSuccess();
      } else {
        setError(data.message || 'Gagal mengirim instruksi instalasi printer.');
      }
    } catch (err: any) {
      setError(err.message || 'Koneksi ke backend server gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EAF0FF] text-[#2F6BFF] border border-[#BFDBFE] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">
                Install Printer ke Komputer Lain (A → B)
              </h3>
              <p className="text-xs text-[#6B7280]">
                Sumber: <strong>{sourceAgent.name || sourceAgent.hostname}</strong> &bull; Printer: <strong>{printerName}</strong>
              </p>
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

        {/* Content */}
        <form onSubmit={handleInstall} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <span>{error}</span>
            </div>
          )}

          {/* Hasil Eksekusi */}
          {results && (
            <div className="space-y-2 p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs">
              <span className="font-semibold text-[#111827] block">Hasil Dispatch Instalasi:</span>
              {results.map((r) => {
                const target = agents.find((a) => a.agentId === r.targetAgentId);
                return (
                  <div
                    key={r.targetAgentId}
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      r.success
                        ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]'
                        : 'bg-[#FEF2F2] border-[#FEE2E2] text-[#B91C1C]'
                    }`}
                  >
                    <div>
                      <span className="font-semibold">{target?.name || target?.hostname || r.targetAgentId}</span>
                      {r.endpointUsed && (
                        <span className="text-[10px] font-mono block text-[#6B7280]">
                          Endpoint: {r.endpointUsed}
                        </span>
                      )}
                    </div>
                    <span>{r.success ? 'Berhasil Terpasang' : `Gagal: ${r.error || 'Unknown'}`}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1">
              Nama Antrean Queue di Komputer Target (B)
            </label>
            <input
              type="text"
              required
              value={targetQueueName}
              onChange={(e) => setTargetQueueName(e.target.value)}
              placeholder="e.g. PC_A-Thermal"
              disabled={submitting}
              className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#111827] font-mono focus:border-[#2F6BFF] outline-none"
            />
            <span className="text-[11px] text-[#6B7280] mt-1 block">
              Nama ini yang akan muncul di dialog Print Word/Excel komputer target B.
            </span>
          </div>

          {/* Checklist Target Agents */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#374151]">
                Pilih Komputer Target (Bisa Multi-Select)
              </label>
              {candidateAgents.length > 0 && (
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-[#2F6BFF] hover:underline font-medium"
                >
                  Pilih Semua
                </button>
              )}
            </div>

            {candidateAgents.length === 0 ? (
              <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-center text-xs text-[#6B7280]">
                Belum ada komputer agent lain yang terdaftar.
              </div>
            ) : (
              <div className="border border-[#E5E7EB] rounded-xl divide-y divide-[#F0F0F0] max-h-56 overflow-y-auto">
                {candidateAgents.map((target) => {
                  const isChecked = selectedTargetIds.has(target.agentId);
                  return (
                    <div
                      key={target.agentId}
                      onClick={() => toggleTarget(target.agentId)}
                      className={`p-3 flex items-center justify-between cursor-pointer hover:bg-[#F9FAFB] transition ${
                        isChecked ? 'bg-[#EAF0FF]/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="rounded border-[#D1D5DB] text-[#2F6BFF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <div>
                          <div className="font-semibold text-xs text-[#111827]">
                            {target.name || target.hostname}
                          </div>
                          <div className="text-[11px] font-mono text-[#6B7280]">
                            Host: {target.hostname || '-'} &bull; OS: {target.os || 'OS'}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={target.status} size="sm" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Set Default Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="setDefaultB"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              disabled={submitting}
              className="rounded border-[#D1D5DB] text-[#2F6BFF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="setDefaultB" className="text-xs text-[#374151] select-none cursor-pointer">
              Jadikan sebagai default printer di komputer target (B)
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-[#6B7280] hover:text-[#111827] rounded-lg transition"
            >
              {results ? 'Tutup' : 'Batal'}
            </button>
            <button
              type="submit"
              disabled={submitting || selectedTargetIds.size === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-[#2F6BFF] hover:bg-[#1F55E0] text-white rounded-lg transition shadow-xs disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengirim Perintah...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Pasang ke {selectedTargetIds.size} Komputer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
