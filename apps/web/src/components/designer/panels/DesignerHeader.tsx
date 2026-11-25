'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Database,
  Sparkles,
  Bot,
  ZoomOut,
  ZoomIn,
  Grid,
  Save,
  Eye,
  Check,
  AlertTriangle,
  Loader2,
  Cpu,
} from 'lucide-react';

interface DesignerHeaderProps {
  reportId: string;
  dbSource: 'database' | 'memory' | 'loading';
  zoom: number;
  setZoom: (z: number) => void;
  showGrid: boolean;
  setShowGrid: (g: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (s: boolean) => void;
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (o: boolean) => void;
  aiPromptInput: string;
  setAiPromptInput: (p: string) => void;
  isAiLoading: boolean;
  onAiGenerate: (e: React.FormEvent) => void;
  onOpenDataSourceModal: () => void;
  onSaveToDatabase: () => Promise<void>;
  isSaving: boolean;
  saveStatus: { message: string; type: 'success' | 'warn' } | null;
}

export function DesignerHeader({
  reportId,
  dbSource,
  zoom,
  setZoom,
  showGrid,
  setShowGrid,
  snapToGrid,
  setSnapToGrid,
  isAiDrawerOpen,
  setIsAiDrawerOpen,
  aiPromptInput,
  setAiPromptInput,
  isAiLoading,
  onAiGenerate,
  onOpenDataSourceModal,
  onSaveToDatabase,
  isSaving,
  saveStatus,
}: DesignerHeaderProps) {
  const router = useRouter();

  // Auto-save before navigating to PDF Preview
  const handlePreviewClick = async () => {
    await onSaveToDatabase();
    router.push(`/reports/${reportId}/preview`);
  };

  return (
    <header className="h-14 bg-[#090d16]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
      {/* Left: Navigation and Telemetry Badges */}
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
            <span className="font-mono text-xs text-slate-200 font-semibold">{reportId || 'Loading...'}</span>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
              dbSource === 'database'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            <Database className="w-3 h-3" />
            <span>{dbSource === 'database' ? 'PostgreSQL Live' : 'Memory Cache'}</span>
          </span>
        </div>
      </div>

      {/* Center: Antigravity AI Command Prompt Pill */}
      <form onSubmit={onAiGenerate} className="hidden md:flex items-center gap-2 max-w-md w-full mx-4">
        <div className="relative flex-1">
          <Sparkles className="w-3.5 h-3.5 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={aiPromptInput}
            onChange={(e) => setAiPromptInput(e.target.value)}
            placeholder="Prompt Gemini AI: 'Add BarChart with items price'..."
            className="w-full bg-[#07090e] border border-white/10 focus:border-sky-500/80 rounded-full pl-9 pr-16 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition"
          />
          <button
            type="submit"
            disabled={isAiLoading || !aiPromptInput.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-0.5 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white rounded-full text-[10px] font-semibold disabled:opacity-40 transition shadow-xs"
          >
            {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Run'}
          </button>
        </div>
      </form>

      {/* Right: Workspace Controls and Action Pills */}
      <div className="flex items-center gap-2">
        {saveStatus && (
          <span
            className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1 rounded-full border animate-in fade-in ${
              saveStatus.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            {saveStatus.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {saveStatus.message}
          </span>
        )}

        {/* AI Studio Trigger */}
        <button
          type="button"
          onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition ${
            isAiDrawerOpen
              ? 'bg-white text-slate-950 font-semibold border-white'
              : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10'
          }`}
          title="Open Gemini AI Chat Assistant"
        >
          <Bot className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">AI Studio</span>
        </button>

        {/* Zoom & Grid Segmented Capsule */}
        <div className="hidden lg:flex items-center bg-[#07090e] border border-white/10 rounded-full p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setZoom(Math.max(50, zoom - 15))}
            className="p-1.5 hover:text-white text-slate-400 hover:bg-white/5 rounded-full transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-[11px] text-slate-300 min-w-[42px] text-center">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom(Math.min(175, zoom + 15))}
            className="p-1.5 hover:text-white text-slate-400 hover:bg-white/5 rounded-full transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-full transition ${showGrid ? 'text-sky-400 bg-white/10' : 'text-slate-500 hover:text-white'}`}
            title="Toggle Grid Lines"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`px-2 py-0.5 text-[10px] font-mono rounded-full transition ${
              snapToGrid ? 'text-sky-400 bg-white/10 font-bold' : 'text-slate-600'
            }`}
            title="Snap to 8px Grid"
          >
            Snap
          </button>
        </div>

        {/* Data Source Button */}
        <button
          type="button"
          onClick={onOpenDataSourceModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#161e31] hover:bg-[#1f2942] text-slate-200 border border-white/10 rounded-full transition"
          title="Configure JSON / REST Data Source"
        >
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Data Source</span>
        </button>

        {/* Save to Database */}
        <button
          type="button"
          onClick={onSaveToDatabase}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-full active:scale-95 transition shadow-sm disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save DB'}</span>
        </button>

        {/* PDF Preview */}
        <button
          type="button"
          onClick={handlePreviewClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white text-slate-950 hover:bg-slate-200 rounded-full active:scale-95 transition shadow-sm"
          title="Auto-saves to PostgreSQL and opens Live PDF Preview"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Live Preview</span>
        </button>
      </div>
    </header>
  );
}
