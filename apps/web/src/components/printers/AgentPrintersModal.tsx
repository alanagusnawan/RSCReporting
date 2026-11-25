'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Play,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Star,
  Trash2,
  Share2,
  ExternalLink,
  ShieldAlert,
  Server,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/apiConfig';
import { InstallToAgentModal } from './InstallToAgentModal';

interface AgentPrinterDetail {
  id: string;
  name: string;
  isDefault: boolean;
  status: string;
  shared: boolean;
  shareName?: string;
  protocol?: string;
  smbPath?: string;
  ippUri?: string;
  socketUri?: string;
  relayUri?: string;
}

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
  agent: AgentItem | null;
  allAgents?: AgentItem[];
  onOpenRegisterPrinter: (agentId: string) => void;
  onRefresh?: () => void;
}

export function AgentPrintersModal({
  isOpen,
  onClose,
  agent,
  allAgents = [],
  onOpenRegisterPrinter,
  onRefresh,
}: Props) {
  const [testingPrinter, setTestingPrinter] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [currentDefaultPrinter, setCurrentDefaultPrinter] = useState<string | null>(null);
  const [deletingPrinter, setDeletingPrinter] = useState<string | null>(null);
  const [sharingPrinter, setSharingPrinter] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Detail printers dari database (termasuk status share, smbPath, ippUri, relayUri)
  const [printerDetails, setPrinterDetails] = useState<Record<string, AgentPrinterDetail>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modal Install to Agent target B
  const [installModalTarget, setInstallModalTarget] = useState<string | null>(null);

  const fetchPrinterDetails = async (agentId: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/printers/agents/${agentId}/printers`);
      if (res.ok) {
        const data: AgentPrinterDetail[] = await res.json();
        const map: Record<string, AgentPrinterDetail> = {};
        for (const item of data) {
          map[item.name] = item;
          if (item.isDefault) {
            setCurrentDefaultPrinter(item.name);
          }
        }
        setPrinterDetails(map);
      }
    } catch {} finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (isOpen && agent) {
      fetchPrinterDetails(agent.agentId);
      if (agent.printers.length > 0 && !currentDefaultPrinter) {
        setCurrentDefaultPrinter(agent.printers[0]);
      }
    }
  }, [isOpen, agent]);

  if (!isOpen || !agent) return null;

  const handleTestPrint = async (printerName: string) => {
    setTestingPrinter(printerName);
    setStatusFeedback(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/printers/${encodeURIComponent(printerName)}/test`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatusFeedback({
          success: true,
          message: `Halaman uji cetak berhasil dikirim ke printer "${printerName}"!`,
        });
      } else {
        setStatusFeedback({
          success: false,
          message: data.result?.message || 'Gagal mengirim test print.',
        });
      }
    } catch {
      setStatusFeedback({
        success: false,
        message: 'Koneksi ke backend server gagal.',
      });
    } finally {
      setTestingPrinter(null);
    }
  };

  const handleSetDefault = async (printerName: string) => {
    setSettingDefault(printerName);
    setStatusFeedback(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/printers/agents/${agent.agentId}/printers/${encodeURIComponent(printerName)}/default`,
        { method: 'POST' }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setCurrentDefaultPrinter(printerName);
        setStatusFeedback({
          success: true,
          message: `Printer "${printerName}" berhasil disetel sebagai default di OS agent!`,
        });
        if (onRefresh) onRefresh();
      } else {
        setStatusFeedback({
          success: false,
          message: data.message || 'Gagal mengubah default printer.',
        });
      }
    } catch {
      setStatusFeedback({
        success: false,
        message: 'Koneksi ke server/agent gagal.',
      });
    } finally {
      setSettingDefault(null);
    }
  };

  const handleToggleShare = async (printerName: string, currentlyShared: boolean) => {
    setSharingPrinter(printerName);
    setStatusFeedback(null);
    try {
      const action = currentlyShared ? 'unshare' : 'share';
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/printers/agents/${agent.agentId}/printers/${encodeURIComponent(printerName)}/${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ protocol: 'auto' }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatusFeedback({
          success: true,
          message: currentlyShared
            ? `Printer "${printerName}" berhenti dibagikan (Unshared).`
            : `Printer "${printerName}" berhasil dibagikan! Endpoint siap digunakan komputer lain.`,
        });
        fetchPrinterDetails(agent.agentId);
      } else {
        setStatusFeedback({
          success: false,
          message: data.message || `Gagal ${action} printer.`,
        });
      }
    } catch {
      setStatusFeedback({
        success: false,
        message: 'Koneksi ke server/agent gagal.',
      });
    } finally {
      setSharingPrinter(null);
    }
  };

  const handleDeletePrinter = async (printerName: string) => {
    if (!confirm(`Hapus printer "${printerName}" dari sistem operasi komputer agent? Antrean printer ini akan dicopot dari Windows/CUPS.`)) {
      return;
    }
    setDeletingPrinter(printerName);
    setStatusFeedback(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/printers/agents/${agent.agentId}/printers/${encodeURIComponent(printerName)}`,
        { method: 'DELETE' }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatusFeedback({
          success: true,
          message: `Printer "${printerName}" berhasil dihapus dari sistem operasi agent!`,
        });
        if (onRefresh) onRefresh();
        fetchPrinterDetails(agent.agentId);
      } else {
        setStatusFeedback({
          success: false,
          message: data.message || 'Gagal menghapus printer.',
        });
      }
    } catch {
      setStatusFeedback({
        success: false,
        message: 'Koneksi ke server/agent gagal.',
      });
    } finally {
      setDeletingPrinter(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-2xl bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EAF0FF] text-[#2F6BFF] border border-[#BFDBFE] flex items-center justify-center">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                  <span>Daftar Printer Workstation</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      agent.status === 'online'
                        ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                        : 'bg-[#F3F4F6] text-[#4B5563]'
                    }`}
                  >
                    {agent.status.toUpperCase()}
                  </span>
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Agent: <strong className="text-[#111827]">{agent.name}</strong> ({agent.hostname || agent.agentId.slice(0, 8)})
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
          <div className="p-6 overflow-y-auto space-y-4">
            {statusFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusFeedback.success
                    ? 'bg-[#F0FDF4] border border-[#DCFCE7] text-[#15803D]'
                    : 'bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C]'
                }`}
              >
                {statusFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                )}
                <span>{statusFeedback.message}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[#374151]">
                Printer Terdeteksi ({agent.printers.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegisterPrinter(agent.agentId);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#2F6BFF] hover:bg-[#1F55E0] text-white rounded-lg transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Printer Baru</span>
              </button>
            </div>

            {agent.printers.length === 0 ? (
              <div className="py-8 text-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
                <p className="text-xs text-[#6B7280] mb-2">Belum ada printer yang terdaftar di komputer agent ini.</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRegisterPrinter(agent.agentId);
                  }}
                  className="text-xs text-[#2F6BFF] hover:underline font-medium"
                >
                  + Tambahkan printer pertama sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {agent.printers.map((printerName, idx) => {
                  const detail = printerDetails[printerName];
                  const isShared = Boolean(detail?.shared || detail?.smbPath || detail?.ippUri || detail?.relayUri);
                  const activeEndpoint = detail?.smbPath || detail?.relayUri || detail?.ippUri;

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-[#E5E7EB] rounded-2xl hover:border-[#D1D5DB] transition-all space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] shrink-0">
                            <Printer className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[#111827] truncate">{printerName}</span>
                              {currentDefaultPrinter === printerName && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[10px] font-mono font-bold">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                  <span>Default</span>
                                </span>
                              )}
                              {isShared && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#15803D] text-[10px] font-mono font-bold">
                                  <Share2 className="w-2.5 h-2.5" />
                                  <span>Shared</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                              Status: Ready &bull; Queue OS Lokal
                            </div>
                          </div>
                        </div>

                        {/* Top Quick Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Test Print */}
                          <button
                            type="button"
                            onClick={() => handleTestPrint(printerName)}
                            disabled={testingPrinter === printerName}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#D1D5DB] rounded-lg transition shadow-2xs"
                            title="Kirim halaman uji cetak"
                          >
                            {testingPrinter === printerName ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-[#2F6BFF]" />
                            ) : (
                              <Play className="w-3 h-3 text-[#16A34A]" />
                            )}
                            <span>Test</span>
                          </button>

                          {/* Set Default */}
                          {currentDefaultPrinter === printerName ? (
                            <div
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-lg select-none cursor-default"
                              title="Printer ini sedang menjadi default di OS"
                            >
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>Default</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(printerName)}
                              disabled={settingDefault === printerName}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#D1D5DB] rounded-lg transition shadow-2xs"
                              title="Jadikan sebagai Default Printer di OS Agent"
                            >
                              {settingDefault === printerName ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-[#D97706]" />
                              ) : (
                                <Star className="w-3 h-3 text-[#9CA3AF]" />
                              )}
                              <span>Set Default</span>
                            </button>
                          )}

                          {/* Hapus Printer */}
                          <button
                            type="button"
                            onClick={() => handleDeletePrinter(printerName)}
                            disabled={deletingPrinter === printerName}
                            className="p-1.5 text-[#DC2626] hover:bg-[#FEE2E2] border border-transparent hover:border-[#FCA5A5] rounded-lg transition"
                            title="Hapus printer dari OS Agent"
                          >
                            {deletingPrinter === printerName ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Share & Remote Install Action Ribbon */}
                      <div className="pt-2.5 border-t border-[#F0F0F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        <div className="text-[11px] font-mono text-[#6B7280] truncate">
                          {activeEndpoint ? (
                            <span className="flex items-center gap-1 text-[#2F6BFF] truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF]" />
                              <span>{activeEndpoint}</span>
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF]">Belum dibagikan ke jaringan LAN</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Toggle Share / Unshare Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleShare(printerName, isShared)}
                            disabled={sharingPrinter === printerName}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                              isShared
                                ? 'bg-white hover:bg-[#F9FAFB] text-[#374151] border-[#D1D5DB]'
                                : 'bg-[#EAF0FF] hover:bg-[#D7E4FF] text-[#1E40AF] border-[#BFDBFE]'
                            }`}
                          >
                            {sharingPrinter === printerName ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Share2 className="w-3 h-3" />
                            )}
                            <span>{isShared ? 'Unshare' : 'Bagikan (Share)'}</span>
                          </button>

                          {/* Install to Other Agent Button */}
                          <button
                            type="button"
                            onClick={() => setInstallModalTarget(printerName)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#2F6BFF] hover:bg-[#1F55E0] text-white shadow-xs transition active:scale-98"
                            title="Pasang antrean printer ini ke komputer lain (B)"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Install to Agent</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[#E5E7EB] flex justify-end bg-[#F9FAFB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6B7280] hover:text-[#111827] rounded-lg transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Modal Install to Agent Target B */}
      {installModalTarget && (
        <InstallToAgentModal
          isOpen={Boolean(installModalTarget)}
          onClose={() => setInstallModalTarget(null)}
          sourceAgent={agent}
          printerName={installModalTarget}
          agents={allAgents}
          onSuccess={() => {
            fetchPrinterDetails(agent.agentId);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
}
