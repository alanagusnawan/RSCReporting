import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, Laptop } from 'lucide-react';
import { AgentItem } from './AgentTable';

interface AgentHealthWidgetProps {
  agents: AgentItem[];
}

export function AgentHealthWidget({ agents }: AgentHealthWidgetProps) {
  const total = agents.length;
  const onlineCount = agents.filter((a) => a.status === 'online').length;
  const offlineCount = total - onlineCount;
  const onlinePercent = total > 0 ? Math.round((onlineCount / total) * 100) : 0;
  const hasOffline = offlineCount > 0;

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#2F6BFF]" />
          <span>Agent Health & Telemetry</span>
        </h3>
        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#EAF0FF] text-[#2F6BFF]">
          {onlinePercent}% Uptime
        </span>
      </div>

      {/* Segmented Progress Bar */}
      <div>
        <div className="w-full h-2.5 rounded-full bg-[#F3F4F6] overflow-hidden flex">
          <div
            style={{ width: `${onlinePercent}%` }}
            className="h-full bg-[#16A34A] transition-all duration-300"
            title={`${onlineCount} Online`}
          />
          <div
            style={{ width: `${100 - onlinePercent}%` }}
            className="h-full bg-[#D1D5DB] transition-all duration-300"
            title={`${offlineCount} Offline`}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[#6B7280] mt-2 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <strong className="text-[#111827]">{onlineCount}</strong> Online
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
            <strong className="text-[#111827]">{offlineCount}</strong> Offline
          </span>
        </div>
      </div>

      {/* Warning Notice if any agent offline */}
      {hasOffline && (
        <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706] mt-0.5" />
          <div className="leading-snug">
            <strong>{offlineCount} Workstation Offline:</strong> Pastikan agent service di terminal kasir target sedang berjalan.
          </div>
        </div>
      )}
    </div>
  );
}
