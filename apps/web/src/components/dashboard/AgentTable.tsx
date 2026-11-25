'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  RefreshCw,
  Plus,
  Printer,
  Edit2,
  Trash2,
  Laptop,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Filter,
  Check,
  Clock,
  HardDrive,
  Info,
  SlidersHorizontal,
  Download,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export interface AgentItem {
  agentId: string;
  name: string;
  displayName?: string;
  hostname?: string;
  os?: string;
  version?: string;
  status: 'online' | 'offline';
  printers: string[];
  lastSeenAt?: string;
}

interface AgentTableProps {
  agents: AgentItem[];
  loading: boolean;
  onRefresh: () => void;
  onOpenRegisterModal: () => void;
  onOpenPrintersModal: (agent: AgentItem) => void;
  onOpenEditModal: (agent: AgentItem) => void;
  onDeleteAgent: (agentId: string, name: string) => void;
}

type SortField = 'name' | 'hostname' | 'status' | 'printers' | 'lastSeenAt';
type SortOrder = 'asc' | 'desc';

export function AgentTable({
  agents,
  loading,
  onRefresh,
  onOpenRegisterModal,
  onOpenPrintersModal,
  onOpenEditModal,
  onDeleteAgent,
}: AgentTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc'); // Online first by default
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update refreshed timestamp
  useEffect(() => {
    if (!loading) {
      setLastRefreshedAt(new Date());
    }
  }, [loading]);

  // Relative time helper
  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return { text: 'Tidak ada data', isStale: true };
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return { text: 'Baru saja', isStale: false };
    if (diffMin < 60) return { text: `${diffMin} mnt lalu`, isStale: diffMin > 10 };
    if (diffHour < 24) return { text: `${diffHour} jam lalu`, isStale: true };
    return { text: date.toLocaleDateString('id-ID'), isStale: true };
  };

  // Filter & Search Logic
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (agent.name && agent.name.toLowerCase().includes(q)) ||
        (agent.hostname && agent.hostname.toLowerCase().includes(q)) ||
        (agent.agentId && agent.agentId.toLowerCase().includes(q)) ||
        agent.printers.some((p) => p.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'online' && agent.status === 'online') ||
        (statusFilter === 'offline' && agent.status !== 'online');

      return matchesSearch && matchesStatus;
    });
  }, [agents, search, statusFilter]);

  // Sort Logic
  const sortedAgents = useMemo(() => {
    return [...filteredAgents].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'name') {
        valA = a.name || a.hostname || '';
        valB = b.name || b.hostname || '';
      } else if (sortField === 'printers') {
        valA = a.printers.length;
        valB = b.printers.length;
      } else if (sortField === 'lastSeenAt') {
        valA = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
        valB = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
      } else if (sortField === 'status') {
        valA = a.status === 'online' ? 1 : 0;
        valB = b.status === 'online' ? 1 : 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAgents, sortField, sortOrder]);

  // Pagination Logic
  const totalItems = sortedAgents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedAgents = sortedAgents.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Row selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedAgents.map((a) => a.agentId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (agentId: string) => {
    const next = new Set(selectedIds);
    if (next.has(agentId)) {
      next.delete(agentId);
    } else {
      next.add(agentId);
    }
    setSelectedIds(next);
  };

  const allSelectedOnPage =
    paginatedAgents.length > 0 &&
    paginatedAgents.every((a) => selectedIds.has(a.agentId));

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#111827] flex items-center gap-2">
            <span>Agent Telemetry & Connected Devices</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#F4F4F5] text-[#6B7280]">
              {agents.length} Total
            </span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Monitor workstation kasir dan perangkat cetak yang tersambung via WebSocket.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari agent, host, printer..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#111827] placeholder-[#9CA3AF] focus:border-[#2F6BFF] focus:ring-2 focus:ring-[#2F6BFF]/20 outline-none transition-all"
            />
            <span className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-[#9CA3AF] bg-[#F4F4F5] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
              /
            </span>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] focus:border-[#2F6BFF] outline-none cursor-pointer transition-all"
            >
              <option value="all">Semua Status</option>
              <option value="online">Online Saja</option>
              <option value="offline">Offline Saja</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB] shadow-xs active:scale-98 transition-all disabled:opacity-50"
            title="Refresh telemetri status"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#6B7280] ${loading ? 'animate-spin text-[#2F6BFF]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Download Print Agent */}
          <a
            href="https://github.com/alanagusnawan/RSCPrinting/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white hover:bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] shadow-xs active:scale-98 transition-all"
            title="Download RSC Print Agent Service dari GitHub Release"
          >
            <Download className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Download Agent</span>
          </a>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onOpenRegisterModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#2F6BFF] hover:bg-[#1F55E0] text-white shadow-xs active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Printer Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Bulk Action Bar (when rows are checked) */}
      {selectedIds.size > 0 && (
        <div className="bg-[#EAF0FF] border-b border-[#BFDBFE] px-5 py-2.5 flex items-center justify-between text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-[#1E40AF] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#2F6BFF]" />
            <span>
              <strong>{selectedIds.size}</strong> agent dipilih
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="px-2.5 py-1 text-xs font-medium rounded bg-white hover:bg-[#F4F4F5] text-[#1E40AF] border border-[#BFDBFE] shadow-2xs"
            >
              Refresh Terpilih
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2 py-1 text-xs text-[#6B7280] hover:text-[#111827]"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* 3. The Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              <th scope="col" className="w-10 px-4 py-3.5">
                <input
                  type="checkbox"
                  aria-label="Pilih semua di halaman ini"
                  checked={allSelectedOnPage}
                  onChange={handleSelectAll}
                  className="rounded border-[#D1D5DB] text-[#2F6BFF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </th>

              <th
                scope="col"
                aria-sort={sortField === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                onClick={() => handleSort('name')}
                className="px-4 py-3.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer select-none hover:text-[#111827]"
              >
                <div className="flex items-center gap-1">
                  <span>Agent Name / ID</span>
                  {sortField === 'name' ? (
                    sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#2F6BFF]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#2F6BFF]" />
                  ) : (
                    <SlidersHorizontal className="w-3 h-3 text-[#D1D5DB]" />
                  )}
                </div>
              </th>

              <th
                scope="col"
                aria-sort={sortField === 'hostname' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                onClick={() => handleSort('hostname')}
                className="px-4 py-3.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer select-none hover:text-[#111827]"
              >
                <div className="flex items-center gap-1">
                  <span>Host & System</span>
                  {sortField === 'hostname' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#2F6BFF]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#2F6BFF]" />
                  )}
                </div>
              </th>

              <th
                scope="col"
                aria-sort={sortField === 'status' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                onClick={() => handleSort('status')}
                className="px-4 py-3.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer select-none hover:text-[#111827]"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {sortField === 'status' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#2F6BFF]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#2F6BFF]" />
                  )}
                </div>
              </th>

              <th
                scope="col"
                aria-sort={sortField === 'printers' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                onClick={() => handleSort('printers')}
                className="px-4 py-3.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer select-none hover:text-[#111827]"
              >
                <div className="flex items-center gap-1">
                  <span>Printers</span>
                  {sortField === 'printers' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#2F6BFF]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#2F6BFF]" />
                  )}
                </div>
              </th>

              <th
                scope="col"
                aria-sort={sortField === 'lastSeenAt' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                onClick={() => handleSort('lastSeenAt')}
                className="px-4 py-3.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer select-none hover:text-[#111827]"
              >
                <div className="flex items-center gap-1">
                  <span>Last Telemetry</span>
                  {sortField === 'lastSeenAt' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#2F6BFF]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#2F6BFF]" />
                  )}
                </div>
              </th>

              <th scope="col" className="px-5 py-3.5 text-right text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F0F0F0] text-xs">
            {loading && agents.length === 0 ? (
              // Loading Skeleton Shimmer
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4"><div className="w-4 h-4 bg-[#E5E7EB] rounded" /></td>
                  <td className="px-4 py-4">
                    <div className="w-32 h-4 bg-[#E5E7EB] rounded mb-1.5" />
                    <div className="w-24 h-3 bg-[#F3F4F6] rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-24 h-4 bg-[#E5E7EB] rounded mb-1" />
                    <div className="w-16 h-3 bg-[#F3F4F6] rounded" />
                  </td>
                  <td className="px-4 py-4"><div className="w-16 h-6 bg-[#E5E7EB] rounded-full" /></td>
                  <td className="px-4 py-4"><div className="w-28 h-4 bg-[#E5E7EB] rounded" /></td>
                  <td className="px-4 py-4"><div className="w-20 h-4 bg-[#E5E7EB] rounded" /></td>
                  <td className="px-4 py-4 text-right"><div className="w-24 h-7 bg-[#E5E7EB] rounded ml-auto" /></td>
                </tr>
              ))
            ) : paginatedAgents.length > 0 ? (
              paginatedAgents.map((agent) => {
                const isSelected = selectedIds.has(agent.agentId);
                const relTime = getRelativeTime(agent.lastSeenAt);

                return (
                  <tr
                    key={agent.agentId}
                    className={`h-16 transition-colors duration-150 relative ${
                      isSelected
                        ? 'bg-[#EAF0FF]/60 hover:bg-[#EAF0FF]'
                        : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    {/* Left selection blue accent */}
                    {isSelected && (
                      <td className="absolute left-0 top-0 bottom-0 w-1 bg-[#2F6BFF]" />
                    )}

                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Pilih agent ${agent.name || agent.hostname}`}
                        checked={isSelected}
                        onChange={() => handleSelectOne(agent.agentId)}
                        className="rounded border-[#D1D5DB] text-[#2F6BFF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                    </td>

                    {/* Agent Name / ID */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#111827] text-sm leading-snug">
                        {agent.name || agent.displayName || agent.hostname}
                      </div>
                      <div className="font-mono text-[11px] text-[#6B7280] flex items-center gap-1 mt-0.5" title={agent.agentId}>
                        <span>ID:</span>
                        <span className="truncate max-w-[150px]">{agent.agentId}</span>
                      </div>
                    </td>

                    {/* Host & System */}
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-medium text-[#374151]">
                        {agent.hostname || '-'}
                      </div>
                      <div className="text-[11px] text-[#6B7280] capitalize mt-0.5">
                        {agent.os || 'OS'} {agent.version ? `(v${agent.version})` : ''}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={agent.status} />
                    </td>

                    {/* Printers */}
                    <td className="px-4 py-3">
                      <div className="group relative inline-block">
                        <div className="font-medium text-[#111827]">
                          {agent.printers.length} Printer Terdeteksi
                        </div>
                        <div className="text-[11px] text-[#6B7280] truncate max-w-[160px] font-mono mt-0.5">
                          {agent.printers.length > 0 ? agent.printers.join(', ') : 'Belum ada printer'}
                        </div>
                        {agent.printers.length > 0 && (
                          <div className="hidden group-hover:block absolute left-0 bottom-full mb-1.5 z-20 bg-[#111827] text-white p-2.5 rounded-xl shadow-lg text-[11px] font-mono min-w-[200px] border border-[#374151]">
                            <span className="text-[10px] text-[#9CA3AF] block font-sans mb-1 font-semibold">Daftar Printer:</span>
                            {agent.printers.map((p, idx) => (
                              <div key={idx} className="truncate">• {p}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Last Telemetry */}
                    <td className="px-4 py-3">
                      <div className={`font-mono text-xs ${relTime.isStale && agent.status === 'online' ? 'text-[#D97706] font-semibold' : 'text-[#374151]'}`}>
                        {relTime.text}
                      </div>
                      <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                        {agent.lastSeenAt ? new Date(agent.lastSeenAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenPrintersModal(agent)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#D1D5DB] shadow-2xs transition-all active:scale-98"
                          title="Buka daftar printer workstation"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#2F6BFF]" />
                          <span>List Printer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenEditModal(agent)}
                          className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                          title="Edit nama workstation agent"
                          aria-label={`Edit ${agent.name || agent.hostname}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteAgent(agent.agentId, agent.name || agent.hostname || 'Agent')}
                          className="p-1.5 rounded-lg text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                          title="Hapus workstation agent dari database"
                          aria-label={`Hapus ${agent.name || agent.hostname}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Laptop className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-[#111827]">Tidak ada data agent yang cocok</p>
                  <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
                    {search ? `Pencarian "${search}" tidak menemukan hasil.` : 'Pastikan aplikasi RSCPrinting berjalan di komputer target.'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Advanced Pagination Footer */}
      <div className="p-4 border-t border-[#E5E7EB] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Summary and Page Size */}
        <div className="flex items-center gap-3 text-[#6B7280]">
          <span>
            Menampilkan <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> -{' '}
            <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> dari{' '}
            <strong>{totalItems}</strong> agent
          </span>
          <span className="text-[#D1D5DB]">|</span>
          <div className="flex items-center gap-1.5">
            <span>Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#111827] outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Right: Page Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={validCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Halaman Pertama"
            aria-label="Halaman Pertama"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Halaman Sebelumnya"
            aria-label="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Number Pills */}
          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show sliding window of pages
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - validCurrentPage) <= 1
                );
              })
              .map((page, idx, arr) => {
                const prevPage = arr[idx - 1];
                const showEllipsis = prevPage && page - prevPage > 1;

                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="text-[#9CA3AF] px-1">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-8 h-8 px-2 text-xs font-semibold rounded-lg transition-colors ${
                        page === validCurrentPage
                          ? 'bg-[#2F6BFF] text-white shadow-2xs'
                          : 'bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB]'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage >= totalPages}
            className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Halaman Berikutnya"
            aria-label="Halaman Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={validCurrentPage >= totalPages}
            className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Halaman Terakhir"
            aria-label="Halaman Terakhir"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
