'use client';

import React, { useState } from 'react';
import { Share2, Trash2, Laptop, ArrowRight, Printer, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/apiConfig';
import { StatusBadge } from './StatusBadge';

export interface PrinterShareItem {
  id: string;
  sourceAgentId: string;
  sourcePrinterName: string;
  targetAgentId: string;
  targetQueueName: string;
  printerType: string;
  endpointUsed: string;
  driverName?: string;
  isDefault: boolean;
  status: 'pending' | 'installed' | 'failed';
  errorMessage?: string;
  createdAt: string;
  sourceAgent?: { name: string; hostname: string; os: string; status: string };
  targetAgent?: { name: string; hostname: string; os: string; status: string };
}

interface SharedPrintersSectionProps {
  shares: PrinterShareItem[];
  loading: boolean;
  onRefresh: () => void;
}

export function SharedPrintersSection({
  shares,
  loading,
  onRefresh,
}: SharedPrintersSectionProps) {
  const [uninstallingId, setUninstallingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleUninstall = async (share: PrinterShareItem) => {
    if (!confirm(`Uninstall printer share "${share.targetQueueName}" dari komputer target? Antrean printer akan dicopot dari OS target.`)) {
      return;
    }

    setUninstallingId(share.id);
    setFeedback(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/printers/shares/${share.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFeedback({
          success: true,
          message: `Printer "${share.targetQueueName}" berhasil dicopot dan dihapus.`,
        });
        onRefresh();
      } else {
        setFeedback({
          success: false,
          message: data.message || 'Gagal mencopot printer share.',
        });
      }
    } catch {
      setFeedback({
        success: false,
        message: 'Koneksi ke backend server gagal.',
      });
    } finally {
      setUninstallingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#111827] flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#2F6BFF]" />
            <span>Cross-Computer Shared Printers (A → B)</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#EAF0FF] text-[#2F6BFF]">
              {shares.length} Pasang Aktif
            </span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Daftar printer fisik dari Komputer A yang telah dipasang ke antrean perangkat Komputer B.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB] shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#6B7280] ${loading ? 'animate-spin text-[#2F6BFF]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`m-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedback.success
              ? 'bg-[#F0FDF4] border border-[#DCFCE7] text-[#15803D]'
              : 'bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C]'
          }`}
        >
          {feedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3.5">Sumber (Komputer A)</th>
              <th className="px-3 py-3.5 text-center">&rarr;</th>
              <th className="px-5 py-3.5">Target (Komputer B)</th>
              <th className="px-5 py-3.5">Queue Name di B</th>
              <th className="px-5 py-3.5">Endpoint Terhubung</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {shares.length > 0 ? (
              shares.map((share) => (
                <tr key={share.id} className="hover:bg-[#F9FAFB] transition">
                  {/* Source */}
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-[#111827]">
                      {share.sourceAgent?.name || share.sourceAgent?.hostname || share.sourceAgentId}
                    </div>
                    <div className="text-[11px] text-[#2F6BFF] font-mono flex items-center gap-1 mt-0.5">
                      <Printer className="w-3 h-3" />
                      <span>{share.sourcePrinterName}</span>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 text-center text-[#9CA3AF]">
                    <ArrowRight className="w-4 h-4 mx-auto text-[#2F6BFF]" />
                  </td>

                  {/* Target */}
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-[#111827]">
                      {share.targetAgent?.name || share.targetAgent?.hostname || share.targetAgentId}
                    </div>
                    <div className="text-[11px] text-[#6B7280] font-mono">
                      Host: {share.targetAgent?.hostname || '-'} &bull; OS: {share.targetAgent?.os || 'OS'}
                    </div>
                  </td>

                  {/* Queue Name */}
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-medium text-[#111827] bg-[#F4F4F5] px-2 py-1 rounded border border-[#E5E7EB]">
                      {share.targetQueueName}
                    </span>
                    {share.isDefault && (
                      <span className="text-[10px] text-[#92400E] font-semibold bg-[#FEF3C7] px-1.5 py-0.5 rounded-full ml-1.5">
                        Default
                      </span>
                    )}
                  </td>

                  {/* Endpoint */}
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[11px] text-[#4B5563] truncate block max-w-xs" title={share.endpointUsed}>
                      {share.endpointUsed}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        share.status === 'installed'
                          ? 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
                          : share.status === 'pending'
                          ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                          : 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]'
                      }`}
                    >
                      {share.status.toUpperCase()}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleUninstall(share)}
                      disabled={uninstallingId === share.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg transition disabled:opacity-50"
                      title="Copot printer share ini dari komputer target"
                    >
                      {uninstallingId === share.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      <span>Uninstall</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[#6B7280]">
                  <Share2 className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-[#111827]">Belum ada printer yang dibagikan antar-komputer</p>
                  <p className="text-xs text-[#9CA3AF] mt-1 max-w-sm mx-auto">
                    Buka tab <strong>Print Agents</strong> &rarr; klik <strong>List Printer</strong> pada Agen sumber &rarr; lalu tekan <strong>Install to Agent</strong>.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
