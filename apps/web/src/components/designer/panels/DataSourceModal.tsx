'use client';

import React from 'react';
import {
  X,
  Database,
  Radio,
  FileSpreadsheet,
  FileJson,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataSourceName: string;
  setDataSourceName: (s: string) => void;
  dataProviderType: 'inline' | 'restApi' | 'jsonFile';
  setDataProviderType: (t: 'inline' | 'restApi' | 'jsonFile') => void;
  dataSourceJson: string;
  setDataSourceJson: (j: string) => void;
  restApiUrl: string;
  setRestApiUrl: (u: string) => void;
  isSaving: boolean;
  successMessage: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function DataSourceModal({
  isOpen,
  onClose,
  dataSourceName,
  setDataSourceName,
  dataProviderType,
  setDataProviderType,
  dataSourceJson,
  setDataSourceJson,
  restApiUrl,
  setRestApiUrl,
  isSaving,
  successMessage,
  onSubmit,
}: DataSourceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0e131f] rounded-2xl shadow-2xl border border-white/10 max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Data Source Configuration</h3>
              <p className="text-[11px] text-slate-400">Bind dynamic JSON or REST endpoint to the report canvas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2 text-xs font-medium">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Data Source Name</label>
            <input
              type="text"
              required
              value={dataSourceName}
              onChange={(e) => setDataSourceName(e.target.value)}
              placeholder="e.g. Invoicing Main Dataset"
              className="w-full px-3 py-2 bg-[#07090e] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Provider Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'inline', label: 'Inline JSON', icon: FileJson },
                { id: 'restApi', label: 'REST API', icon: Radio },
                { id: 'jsonFile', label: 'JSON Dataset', icon: FileSpreadsheet },
              ].map((p) => {
                const Icon = p.icon;
                const isSelected = dataProviderType === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setDataProviderType(p.id as any)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition ${
                      isSelected
                        ? 'bg-white text-slate-950 font-bold border-white shadow-xs'
                        : 'bg-[#07090e] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px]">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {dataProviderType === 'restApi' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">REST API URL Endpoint</label>
              <input
                type="url"
                required
                value={restApiUrl}
                onChange={(e) => setRestApiUrl(e.target.value)}
                placeholder="https://api.domain.com/v1/billing/invoices"
                className="w-full px-3 py-2 bg-[#07090e] border border-white/10 rounded-xl text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Sample Runtime JSON Payload
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Bound to =Fields.[field]</span>
            </div>
            <textarea
              rows={8}
              value={dataSourceJson}
              onChange={(e) => setDataSourceJson(e.target.value)}
              className="w-full font-mono text-xs p-3 bg-[#07090e] border border-white/10 rounded-xl text-sky-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition shadow-sm"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSaving ? 'Saving...' : 'Apply & Save Data Source'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
