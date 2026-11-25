'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Printer, RefreshCw, AlertCircle, CheckCircle2, Server, Usb, Globe, Bluetooth } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface AgentItem {
  agentId: string;
  name: string;
  displayName?: string;
  hostname?: string;
  status: 'online' | 'offline';
  printers: string[];
}

interface PrinterTypeOption {
  type: string;
  label: string;
  description: string;
  needDriver: boolean;
  portHint: string;
}

interface AgentOptions {
  types?: PrinterTypeOption[];
  drivers?: string[];
  ports?: Array<{ name: string; description?: string }>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultAgentId?: string;
  onSuccess?: () => void;
}

export function RegisterPrinterModal({ isOpen, onClose, defaultAgentId, onSuccess }: Props) {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [options, setOptions] = useState<AgentOptions | null>(null);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [printerType, setPrinterType] = useState('USB');
  const [driverName, setDriverName] = useState('');
  const [portOrUri, setPortOrUri] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Fetch agents on modal open
  useEffect(() => {
    if (isOpen) {
      loadAgents();
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  // Fetch options when agent changes
  useEffect(() => {
    if (selectedAgentId) {
      loadOptions(selectedAgentId);
    } else {
      setOptions(null);
    }
  }, [selectedAgentId]);

  const loadAgents = async () => {
    setLoadingAgents(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/printers/agents`);
      if (res.ok) {
        const data: AgentItem[] = await res.json();
        setAgents(data);
        if (defaultAgentId && data.some((a) => a.agentId === defaultAgentId)) {
          setSelectedAgentId(defaultAgentId);
        } else {
          const online = data.find((a) => a.status === 'online');
          if (online) {
            setSelectedAgentId(online.agentId);
          } else if (data.length > 0) {
            setSelectedAgentId(data[0].agentId);
          }
        }
      } else {
        setError(`Gagal mengambil daftar Print Agent dari server (HTTP ${res.status}).`);
      }
    } catch (err: any) {
      const targetUrl = `${getApiBaseUrl()}/api/v1/printers/agents`;
      setError(`Koneksi ke backend server gagal (${targetUrl}): ${err?.message || 'Network Error'}`);
    } finally {
      setLoadingAgents(false);
    }
  };

  const loadOptions = async (agentId: string) => {
    setLoadingOptions(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/printers/agents/${agentId}/options`);
      if (res.ok) {
        const data: AgentOptions = await res.json();
        setOptions(data);
        if (data.drivers && data.drivers.length > 0) {
          setDriverName(data.drivers[0]);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.message || 'Agent belum merespons options. Silakan pilih dari driver standar yang tersedia.');
        setOptions({
          types: [
            { type: 'USB', label: 'USB Printer', description: 'Port USB Lokal', needDriver: true, portHint: 'USB001' },
            { type: 'IP', label: 'Network (IP)', description: 'TCP/IP Port 9100', needDriver: true, portHint: '192.168.1.200' },
            { type: 'BLUETOOTH', label: 'Bluetooth / Serial', description: 'Virtual COM Port', needDriver: true, portHint: 'COM3' },
            { type: 'HTTP_SHARED', label: 'Shared / IPP', description: 'URL / SMB Share', needDriver: false, portHint: 'http://server:631/printers/Kasir' },
          ],
          drivers: [
            'Generic / Text Only',
            'EPSON TM-T(203dpi) Receipt6',
            'EPSON L3210 Series',
            'Microsoft Print to PDF',
          ],
          ports: [
            { name: 'USB001', description: 'Virtual printer port for USB' },
            { name: 'USB002', description: 'Virtual printer port for USB' },
            { name: 'COM1:', description: 'Serial Port' },
            { name: 'COM3:', description: 'Serial Port' },
          ]
        });
        setDriverName('Generic / Text Only');
      }
    } catch {
      setError('Agent belum merespons options. Mode pilihan standar telah diaktifkan.');
      setOptions({
        types: [
          { type: 'USB', label: 'USB Printer', description: 'Port USB Lokal', needDriver: true, portHint: 'USB001' },
          { type: 'IP', label: 'Network (IP)', description: 'TCP/IP Port 9100', needDriver: true, portHint: '192.168.1.200' },
          { type: 'BLUETOOTH', label: 'Bluetooth / Serial', description: 'Virtual COM Port', needDriver: true, portHint: 'COM3' },
          { type: 'HTTP_SHARED', label: 'Shared / IPP', description: 'URL / SMB Share', needDriver: false, portHint: 'http://server:631/printers/Kasir' },
        ],
        drivers: [
          'Generic / Text Only',
          'EPSON TM-T(203dpi) Receipt6',
          'EPSON L3210 Series',
          'Microsoft Print to PDF',
        ],
        ports: [
          { name: 'USB001', description: 'Virtual printer port for USB' },
          { name: 'USB002', description: 'Virtual printer port for USB' },
          { name: 'COM1:', description: 'Serial Port' },
          { name: 'COM3:', description: 'Serial Port' },
        ]
      });
      setDriverName('Generic / Text Only');
    } finally {
      setLoadingOptions(false);
    }
  };

  // Filter Ports by Printer Type & Deduplicate
  const availableUsbPorts = useMemo(() => {
    if (!options?.ports) return [];
    const ports = options.ports.filter((p) => p.name.toUpperCase().startsWith('USB'));
    const seen = new Set<string>();
    return ports.filter((p) => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    });
  }, [options?.ports]);

  const availableComPorts = useMemo(() => {
    if (!options?.ports) return [];
    const ports = options.ports.filter((p) => p.name.toUpperCase().startsWith('COM'));
    const seen = new Set<string>();
    return ports.filter((p) => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    });
  }, [options?.ports]);

  // Deduplicate drivers to guarantee unique keys
  const uniqueDrivers = useMemo(() => {
    if (!options?.drivers) return [];
    const seen = new Set<string>();
    const res: string[] = [];
    for (const d of options.drivers) {
      const clean = d.trim();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        res.push(clean);
      }
    }
    return res;
  }, [options?.drivers]);

  // Adjust port value when connection type changes
  useEffect(() => {
    if (printerType === 'USB') {
      if (availableUsbPorts.length > 0) {
        setPortOrUri(availableUsbPorts[0].name);
      } else {
        setPortOrUri('USB001');
      }
    } else if (printerType === 'BLUETOOTH') {
      if (availableComPorts.length > 0) {
        setPortOrUri(availableComPorts[0].name);
      } else {
        setPortOrUri('COM3');
      }
    } else if (printerType === 'IP') {
      if (!portOrUri || portOrUri.startsWith('USB') || portOrUri.startsWith('COM') || portOrUri.startsWith('http')) {
        setPortOrUri('192.168.1.200');
      }
    } else if (printerType === 'HTTP_SHARED') {
      if (!portOrUri.startsWith('http') && !portOrUri.startsWith('\\\\')) {
        setPortOrUri('http://192.168.1.10:631/printers/Kasir');
      }
    }
  }, [printerType, availableUsbPorts, availableComPorts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) {
      setError('Pilih Print Agent target terlebih dahulu.');
      return;
    }
    if (!name.trim()) {
      setError('Nama printer tidak boleh kosong.');
      return;
    }
    if (!portOrUri.trim()) {
      setError('Port atau URI printer tidak boleh kosong.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/printers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          name: name.trim(),
          driverName: driverName.trim() || undefined,
          printerType,
          portOrUri: portOrUri.trim(),
          isDefault,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        setSuccessMsg(`Printer "${name}" berhasil didaftarkan di komputer agent!`);
        setName('');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(json.error || json.message || 'Gagal mendaftarkan printer.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim instruksi registrasi printer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentTypeMeta = options?.types?.find((t) => t.type === printerType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EAF0FF] text-[#2F6BFF] border border-[#BFDBFE] flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Register Printer ke Agent</h3>
              <p className="text-xs text-[#6B7280]">Tambahkan antrean printer fisik langsung ke OS workstation</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] text-[#15803D] rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Target Print Agent */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Target Print Agent (Komputer Tujuan)
            </label>
            <div className="flex gap-2">
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                disabled={loadingAgents || submitting}
                className="flex-1 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] focus:border-[#2F6BFF] outline-none"
              >
                {agents.length === 0 ? (
                  <option value="">Tidak ada agent terdeteksi</option>
                ) : (
                  agents.map((agent) => (
                    <option key={agent.agentId} value={agent.agentId}>
                      {agent.name || agent.displayName || agent.hostname} ({agent.status.toUpperCase()}) - {agent.hostname || agent.agentId.slice(0, 8)}
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={() => selectedAgentId && loadOptions(selectedAgentId)}
                disabled={loadingOptions || !selectedAgentId}
                className="px-3 py-2 bg-white hover:bg-[#F9FAFB] text-[#374151] rounded-lg text-xs font-medium transition border border-[#E5E7EB] shadow-2xs flex items-center gap-1"
                title="Refresh Driver & Port dari Agent"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOptions ? 'animate-spin text-[#2F6BFF]' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {loadingOptions ? (
            <div className="py-8 flex flex-col items-center justify-center text-xs text-[#6B7280] gap-2">
              <RefreshCw className="w-5 h-5 text-[#2F6BFF] animate-spin" />
              <span>Mengambil daftar Driver & Port langsung dari OS Agent...</span>
            </div>
          ) : (
            <>
              {/* Nama Printer */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Nama Printer Baru
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Kasir Thermal 80mm atau Epson L3210"
                  disabled={submitting}
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] focus:border-[#2F6BFF] outline-none"
                  required
                />
              </div>

              {/* Tipe Koneksi Printer */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Tipe Koneksi Printer
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'USB', label: 'USB Printer', description: 'Port USB Lokal' },
                    { type: 'IP', label: 'Network (IP)', description: 'TCP/IP Port 9100' },
                    { type: 'BLUETOOTH', label: 'Bluetooth / Serial', description: 'Virtual COM Port' },
                    { type: 'HTTP_SHARED', label: 'Shared / IPP', description: 'URL / SMB Share' },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setPrinterType(t.type)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                        printerType === t.type
                          ? 'border-[#2F6BFF] bg-[#EAF0FF] text-[#1E40AF] font-medium'
                          : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <div className="mt-0.5">
                        {t.type === 'USB' && <Usb className="w-4 h-4 text-[#2F6BFF]" />}
                        {t.type === 'IP' && <Globe className="w-4 h-4 text-[#16A34A]" />}
                        {t.type === 'BLUETOOTH' && <Bluetooth className="w-4 h-4 text-[#8B5CF6]" />}
                        {t.type === 'HTTP_SHARED' && <Server className="w-4 h-4 text-[#0284C7]" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#111827]">{t.label}</div>
                        <div className="text-[10px] text-[#6B7280] line-clamp-1">{t.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Port / IP Sesuai Tipe Koneksi */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[#374151]">
                    {printerType === 'USB' && 'Pilih Port USB di Komputer Agent'}
                    {printerType === 'IP' && 'IP Address Printer (LAN / Wi-Fi)'}
                    {printerType === 'BLUETOOTH' && 'Pilih COM Port Bluetooth'}
                    {printerType === 'HTTP_SHARED' && 'URL Shared Printer / IPP'}
                  </label>
                  <span className="text-[10px] text-[#9CA3AF] font-mono">
                    {printerType === 'USB' && `${availableUsbPorts.length} port USB`}
                    {printerType === 'BLUETOOTH' && `${availableComPorts.length} COM port`}
                  </span>
                </div>

                {printerType === 'USB' && (
                  availableUsbPorts.length > 0 ? (
                    <select
                      value={portOrUri}
                      onChange={(e) => setPortOrUri(e.target.value)}
                      disabled={submitting}
                      className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] focus:border-[#2F6BFF] font-mono outline-none"
                    >
                      {availableUsbPorts.map((p, idx) => (
                        <option key={`usb-${p.name}-${idx}`} value={p.name}>
                          {p.name} {p.description ? `— (${p.description})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={portOrUri}
                      onChange={(e) => setPortOrUri(e.target.value)}
                      placeholder="USB001"
                      disabled={submitting}
                      className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] focus:border-[#2F6BFF] font-mono outline-none"
                      required
                    />
                  )
                )}

                {printerType === 'IP' && (
                  <div>
                    <input
                      type="text"
                      value={portOrUri}
                      onChange={(e) => setPortOrUri(e.target.value)}
                      placeholder="192.168.1.200"
                      disabled={submitting}
                      className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] focus:border-[#2F6BFF] font-mono outline-none"
                      required
                    />
                    <span className="text-[10px] text-[#6B7280] mt-1 block">
                      Masukkan IP statis printer (misal: <code>192.168.1.200</code>). Port TCP 9100 dibuat otomatis.
                    </span>
                  </div>
                )}

                {printerType === 'BLUETOOTH' && (
                  availableComPorts.length > 0 ? (
                    <select
                      value={portOrUri}
                      onChange={(e) => setPortOrUri(e.target.value)}
                      disabled={submitting}
                      className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] focus:border-[#2F6BFF] font-mono outline-none"
                    >
                      {availableComPorts.map((p, idx) => (
                        <option key={`com-${p.name}-${idx}`} value={p.name}>
                          {p.name} {p.description ? `(${p.description})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={portOrUri}
                      onChange={(e) => setPortOrUri(e.target.value)}
                      placeholder="COM3"
                      disabled={submitting}
                      className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] focus:border-[#2F6BFF] font-mono outline-none"
                      required
                    />
                  )
                )}

                {printerType === 'HTTP_SHARED' && (
                  <div>
                    <input
                      type="text"
                      value={portOrUri}
                      onChange={(e) => setPortOrUri(e.target.value)}
                      placeholder="http://server:631/printers/NamaPrinter"
                      disabled={submitting}
                      className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] focus:border-[#2F6BFF] font-mono outline-none"
                      required
                    />
                    <span className="text-[10px] text-[#6B7280] mt-1 block">
                      Contoh: <code>http://192.168.1.10:631/printers/NamaPrinter</code>
                    </span>
                  </div>
                )}
              </div>

              {/* Printer Driver di Komputer Agent (HANYA DARI DROPDOWN) */}
              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1.5">
                  Printer Driver di Komputer Agent
                </label>

                {uniqueDrivers.length > 0 ? (
                  <select
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    disabled={submitting}
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] focus:border-[#2F6BFF] font-medium outline-none"
                  >
                    {uniqueDrivers.map((drv, idx) => (
                      <option key={`drv-${drv}-${idx}`} value={drv}>
                        {drv}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    disabled={submitting}
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111827] focus:border-[#2F6BFF] font-medium outline-none"
                  >
                    <option value="Generic / Text Only">Generic / Text Only</option>
                    <option value="EPSON TM-T(203dpi) Receipt6">EPSON TM-T(203dpi) Receipt6</option>
                    <option value="EPSON L3210 Series">EPSON L3210 Series</option>
                    <option value="Microsoft Print to PDF">Microsoft Print to PDF</option>
                  </select>
                )}
                <span className="text-[10px] text-[#6B7280] mt-1 block">
                  Pilih driver printer yang terpasang pada sistem operasi komputer agent.
                </span>
              </div>

              {/* Default checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  disabled={submitting}
                  className="rounded border-[#D1D5DB] text-[#2F6BFF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="isDefault" className="text-xs text-[#374151] select-none cursor-pointer">
                  Jadikan sebagai default printer di komputer agent
                </label>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-[#6B7280] hover:text-[#111827]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || loadingOptions || !selectedAgentId}
              className="px-5 py-2 text-xs font-semibold bg-[#2F6BFF] hover:bg-[#1F55E0] text-white rounded-lg transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? 'Mendaftarkan...' : 'Daftarkan ke Agent'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
