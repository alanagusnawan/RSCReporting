'use client';

import React from 'react';
import { History, ShieldCheck, Clock, RefreshCw } from 'lucide-react';

export interface AuditLogItem {
  id: string;
  actorUserId?: string;
  action: string;
  sourceAgentId?: string;
  targetAgentId?: string;
  printerName: string;
  detail?: any;
  createdAt: string;
}

interface AuditLogsSectionProps {
  logs: AuditLogItem[];
  loading: boolean;
  onRefresh: () => void;
}

export function AuditLogsSection({ logs, loading, onRefresh }: AuditLogsSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#111827] flex items-center gap-2">
            <History className="w-5 h-5 text-[#2F6BFF]" />
            <span>Audit Trail & Activity Log</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#EAF0FF] text-[#2F6BFF]">
              {logs.length} Log
            </span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Pencatatan riwayat siapa yang membagikan, memasang, atau mencopot printer antar-komputer.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB] shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#6B7280] ${loading ? 'animate-spin text-[#2F6BFF]' : ''}`} />
          <span>Refresh Log</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3.5">Waktu</th>
              <th className="px-5 py-3.5">Action</th>
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Printer Target / Queue</th>
              <th className="px-5 py-3.5">Detail Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {logs.length > 0 ? (
              logs.map((log) => {
                const isInstall = log.action === 'INSTALL';
                const isUninstall = log.action === 'UNINSTALL';
                const isShare = log.action === 'SHARE';

                return (
                  <tr key={log.id} className="hover:bg-[#F9FAFB] transition">
                    <td className="px-5 py-3 font-mono text-[11px] text-[#4B5563] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('id-ID', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isInstall
                            ? 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
                            : isUninstall
                            ? 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]'
                            : isShare
                            ? 'bg-[#EAF0FF] text-[#1E40AF] border border-[#BFDBFE]'
                            : 'bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-[#111827]">
                      {log.actorUserId || 'system'}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#111827]">
                      {log.printerName}
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-[#6B7280]">
                      <span className="truncate block max-w-sm" title={JSON.stringify(log.detail)}>
                        {log.detail ? JSON.stringify(log.detail) : '-'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#6B7280]">
                  <History className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-[#111827]">Belum ada riwayat aktivitas</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
