'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Sliders,
  Play,
  Printer,
  Download,
  ExternalLink,
  Code2,
  FileCheck2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Database,
  Plus,
  Terminal,
  FileText,
  Zap,
} from 'lucide-react';
import { PrintDispatchModal } from '@/components/printers/PrintDispatchModal';
import { RegisterPrinterModal } from '@/components/printers/RegisterPrinterModal';
import { getApiBaseUrl } from '@/lib/apiConfig';

const DEFAULT_SAMPLE_JSON = {
  date: '2026-10-29',
  items: [
    { name: 'Takumi Vector PDF Engine', price: 5000000, quantity: 1 },
    { name: 'Custom Template Engineering', price: 1500000, quantity: 2 },
    { name: 'Cloud Storage (MinIO)', price: 2000000, quantity: 1 },
  ],
  customer: {
    name: 'Acme Enterprise',
    address: 'Jakarta, Indonesia',
  },
  invoiceNumber: 'INV-2026-900',
};

export default function PreviewPage({ params }: { params: Promise<{ reportId: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ reportId: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{ sizeBytes?: number; fileName?: string } | null>(null);
  const [templatePageSettings, setTemplatePageSettings] = useState<{
    paperSize?: string;
    orientation?: 'portrait' | 'landscape';
    width?: number;
    height?: number;
    margins?: { top: number; bottom: number; left: number; right: number; unit?: string };
  } | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Editable JSON data payload initialized with default
  const [jsonData, setJsonData] = useState<string>(JSON.stringify(DEFAULT_SAMPLE_JSON, null, 2));

  // Automatically fetch active template definition and sample data from PostgreSQL on mount
  useEffect(() => {
    params.then(async (p) => {
      setResolvedParams(p);
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/v1/templates/${p.reportId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.definition?.pageSettings) {
            setTemplatePageSettings(json.definition.pageSettings);
          }
          if (json.definition?.dataSources && json.definition.dataSources.length > 0) {
            const sample = json.definition.dataSources[0].config?.sampleData;
            if (sample) {
              setJsonData(typeof sample === 'string' ? sample : JSON.stringify(sample, null, 2));
            }
          }
        }
      } catch {}
    });
  }, [params]);

  const handleGenerate = async (target?: { agentId?: string; printerId: string; copies?: number }) => {
    setLoading(true);
    setPrintStatus(null);

    let parsedData: any = {};
    try {
      parsedData = JSON.parse(jsonData);
    } catch {
      alert('Invalid JSON in payload editor. Please check syntax.');
      setLoading(false);
      return;
    }

    const payload = {
      template: resolvedParams?.reportId || 'invoice-v1',
      data: parsedData,
      options: {
        paperSize: templatePageSettings?.paperSize || 'A4',
        orientation: templatePageSettings?.orientation || 'portrait',
        width: templatePageSettings?.width,
        height: templatePageSettings?.height,
        margins: templatePageSettings?.margins,
        locale: 'id-ID',
      },
      output: { mode: 'url', fileName: `${resolvedParams?.reportId}.pdf` },
      printer: target ? { agentId: target.agentId, printerId: target.printerId, copies: target.copies || 1 } : undefined,
    };

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/pdf/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        setPdfUrl(`${getApiBaseUrl()}${json.pdf.url}`);
        setMetadata({ sizeBytes: json.pdf.sizeBytes, fileName: json.pdf.fileName });
        if (json.print) {
          if (json.print.status === 'accepted') {
            setPrintStatus(`Print job successfully dispatched to '${json.print.printerId}' on agent (Status: ${json.print.status})`);
          } else {
            setPrintStatus(`Print job status: ${json.print.status} - ${json.print.message || ''}`);
          }
        }
      } else {
        setPdfUrl('about:blank');
      }
    } catch {
      setPdfUrl('about:blank');
    } finally {
      setLoading(false);
      setIsPrintModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#07090e] text-slate-100 overflow-hidden font-sans antigravity-ambient">
      {/* 1. Antigravity Floating Top Navigation */}
      <header className="h-14 bg-[#090d16]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white px-2.5 py-1 rounded-full text-xs font-medium hover:bg-white/5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Catalog</span>
          </Link>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span className="font-mono text-xs text-slate-200 font-semibold">{resolvedParams?.reportId || 'Loading...'}</span>
            </div>

            {templatePageSettings && (
              <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                {templatePageSettings.paperSize || 'A4'}{' '}
                {templatePageSettings.width && templatePageSettings.height
                  ? `(${templatePageSettings.width} × ${templatePageSettings.height} mm)`
                  : ''}
              </span>
            )}
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white rounded-full active:scale-95 transition shadow-sm disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{loading ? 'Rendering...' : 'Execute & Render'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Dispatch Print</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#161e31] hover:bg-[#1f2942] text-slate-200 border border-white/10 rounded-full transition"
            title="Daftarkan Printer Baru ke Agent"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Add Printer</span>
          </button>

          <Link
            href={`/reports/${resolvedParams?.reportId}/designer`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white text-slate-950 hover:bg-slate-200 rounded-full transition shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Visual Designer</span>
          </Link>
        </div>
      </header>

      {/* 2. Main Mission Control Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: CLI / Terminal Payload Editor */}
        <aside className="w-96 bg-[#090d16] border-r border-white/[0.08] flex flex-col shrink-0">
          <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 items-center mr-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span>Runtime Payload (JSON)</span>
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Database className="w-2.5 h-2.5" /> Live Synced
            </span>
          </div>

          <div className="flex-1 p-3.5 flex flex-col gap-2">
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="flex-1 w-full bg-[#07090e] border border-white/10 rounded-2xl p-3.5 font-mono text-xs text-sky-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none leading-relaxed"
              spellCheck={false}
            />
            <span className="text-[10px] text-slate-500 font-mono px-1">
              Bound to template expressions e.g. <code>=Fields.items.[0].price</code>
            </span>
          </div>
        </aside>

        {/* Right: PDF Stream HUD Viewport */}
        <main className="flex-1 bg-[#07090e] flex flex-col p-6 items-center justify-center overflow-auto">
          {printStatus && (
            <div className="w-full max-w-4xl mb-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 backdrop-blur-md animate-in fade-in">
              <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{printStatus}</span>
            </div>
          )}

          <div className="w-full max-w-4xl h-full bg-[#0e131f] rounded-2xl shadow-2xl border border-white/[0.08] overflow-hidden flex flex-col glow-card">
            {pdfUrl ? (
              <div className="flex-1 flex flex-col">
                {/* PDF Control Strip */}
                <div className="px-4 py-3 bg-[#090d16] border-b border-white/[0.08] flex justify-between items-center text-xs text-slate-400">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-white font-mono">{metadata?.fileName || 'Report Output.pdf'}</span>
                    {metadata?.sizeBytes && (
                      <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-400">
                        {(metadata.sizeBytes / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium text-xs bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1 rounded-full border border-sky-500/20 transition"
                  >
                    <span>Open Vector PDF</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <iframe src={pdfUrl} className="flex-1 w-full border-none bg-slate-900" title="Live Vector PDF Stream" />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-white/[0.03] border border-white/10 text-sky-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">Execution Engine Standby</h2>
                <p className="text-xs text-slate-400 max-w-md mt-2 leading-relaxed">
                  Data source telah disinkronkan. Klik &quot;Execute & Render&quot; untuk me-render Takumi vector PDF secara presisi 1:1 pixel dengan canvas designer.
                </p>
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={loading}
                  className="mt-6 px-6 py-2.5 text-xs font-semibold bg-white text-slate-950 rounded-full hover:bg-slate-200 transition shadow-sm active:scale-95"
                >
                  Generate Live PDF Now
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 3. Modals Integration */}
      <PrintDispatchModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        loading={loading}
        onConfirm={async (agentId, printerId, copies) => {
          await handleGenerate({ agentId, printerId, copies });
        }}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
      />

      <RegisterPrinterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
}
