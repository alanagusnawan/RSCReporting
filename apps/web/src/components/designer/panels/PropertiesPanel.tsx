'use client';

import React from 'react';
import {
  PageSettingsConfig,
  ComponentItem,
  DataConfig,
  TableColumnConfig,
} from '../types';
import {
  Settings,
  Sparkles,
  Layers,
  Copy,
  Trash2,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Database,
  Type,
  Maximize2,
  Check,
  ChevronDown,
  Wand2,
  Loader2,
  Cpu,
} from 'lucide-react';
import { PageSettingsEditor } from './PageSettingsEditor';
import { DataConfigEditor } from './DataConfigEditor';
import { DataSourceAutocomplete } from '../DataSourceAutocomplete';
import { SchemaFieldItem } from '../schemaHelper';

interface PropertiesPanelProps {
  selectedComp: ComponentItem | null;
  activeTab: 'properties' | 'data' | 'styling' | 'page' | 'ai';
  setActiveTab: (tab: 'properties' | 'data' | 'styling' | 'page' | 'ai') => void;
  pageSettings: PageSettingsConfig;
  onPaperSizeChange: (size: PageSettingsConfig['paperSize']) => void;
  onOrientationToggle: (orient: 'portrait' | 'landscape') => void;
  onUpdatePageSettings: (updater: (prev: PageSettingsConfig) => PageSettingsConfig) => void;
  allFields: SchemaFieldItem[];
  dataSourceName: string;
  onUpdateSelected: (key: keyof ComponentItem, val: any) => void;
  onUpdateDataConfig: (key: keyof DataConfig, val: any) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  formulaPrompt: string;
  setFormulaPrompt: (p: string) => void;
  isAiLoading: boolean;
  onAiFormula: () => Promise<void>;
  generatedFormula: string;
  aiPromptInput: string;
  setAiPromptInput: (p: string) => void;
  onAiGenerate: (e: React.FormEvent) => Promise<void>;
}

export function PropertiesPanel({
  selectedComp,
  activeTab,
  setActiveTab,
  pageSettings,
  onPaperSizeChange,
  onOrientationToggle,
  onUpdatePageSettings,
  allFields,
  dataSourceName,
  onUpdateSelected,
  onUpdateDataConfig,
  onDuplicate,
  onDelete,
  formulaPrompt,
  setFormulaPrompt,
  isAiLoading,
  onAiFormula,
  generatedFormula,
  aiPromptInput,
  setAiPromptInput,
  onAiGenerate,
}: PropertiesPanelProps) {
  return (
    <aside className="w-80 bg-[#090d16] border-l border-white/[0.08] flex flex-col shrink-0 overflow-hidden">
      {/* Antigravity Segmented Tab Switcher */}
      <div className="p-3 border-b border-white/[0.08] bg-[#090d16]">
        <div className="flex bg-[#07090e] p-1 rounded-full border border-white/10 text-xs font-medium">
          {selectedComp ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('properties')}
                className={`flex-1 py-1 text-center rounded-full transition ${
                  activeTab === 'properties'
                    ? 'bg-white text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Props
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('data')}
                className={`flex-1 py-1 text-center rounded-full transition ${
                  activeTab === 'data'
                    ? 'bg-white text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Data
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('styling')}
                className={`flex-1 py-1 text-center rounded-full transition ${
                  activeTab === 'styling'
                    ? 'bg-white text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Style
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('page')}
                className={`flex-1 py-1 text-center rounded-full transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'page'
                    ? 'bg-white text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-3 h-3 text-sky-400" />
                <span>Page Layout</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-1 text-center rounded-full transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'ai'
                    ? 'bg-white text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>AI Studio</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* 1. Page Settings Mode (When unclicked or 'page' tab active) */}
        {(!selectedComp || activeTab === 'page') && activeTab !== 'ai' ? (
          <PageSettingsEditor
            pageSettings={pageSettings}
            onPaperSizeChange={onPaperSizeChange}
            onOrientationToggle={onOrientationToggle}
            onUpdateSettings={onUpdatePageSettings}
          />
        ) : activeTab === 'ai' ? (
          /* 2. AI Tools Mode */
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-4 bg-[#0e131f] border border-white/[0.08] rounded-2xl glow-card">
              <div className="flex items-center gap-2 text-white font-bold mb-1">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Gemini AI Auto-Layout</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Describe desired report layout. Gemini reads schema and arranges components automatically.
              </p>

              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  placeholder="e.g. Add sales BarChart and items DataGrid"
                  className="w-full px-3 py-2 bg-[#07090e] border border-white/10 rounded-xl text-white text-xs outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={onAiGenerate}
                  disabled={isAiLoading || !aiPromptInput.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition shadow-sm"
                >
                  {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  <span>Generate to Canvas</span>
                </button>
              </div>
            </div>

            {/* Formula Helper */}
            <div className="p-4 bg-[#0e131f] border border-white/[0.08] rounded-2xl glow-card">
              <div className="flex items-center gap-2 font-bold text-white mb-1">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Expression Synthesizer</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Generate mathematical / formatting formula:
              </p>
              <input
                type="text"
                value={formulaPrompt}
                onChange={(e) => setFormulaPrompt(e.target.value)}
                placeholder="e.g. Sum of price times quantity with 11% tax"
                className="w-full px-3 py-2 bg-[#07090e] border border-white/10 rounded-xl text-white text-xs outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={onAiFormula}
                disabled={isAiLoading || !formulaPrompt.trim()}
                className="w-full mt-2.5 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl font-medium text-xs transition"
              >
                Synthesize Formula
              </button>
              {generatedFormula && (
                <div className="mt-2.5 p-2.5 bg-[#07090e] border border-emerald-500/30 rounded-xl font-mono text-[11px] text-emerald-300 break-all select-all">
                  {generatedFormula}
                </div>
              )}
            </div>
          </div>
        ) : selectedComp ? (
          /* 3. Component Selected Mode */
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <span className="font-bold text-white text-sm block">{selectedComp.name}</span>
                <span className="font-mono text-[10px] text-slate-500">{selectedComp.id}</span>
              </div>
              <span className="font-mono text-[10px] text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                {selectedComp.type}
              </span>
            </div>

            {/* Tab Data Source */}
            {activeTab === 'data' ? (
              <DataConfigEditor
                component={selectedComp}
                allFields={allFields}
                dataSourceName={dataSourceName}
                onUpdateDataConfig={onUpdateDataConfig}
              />
            ) : activeTab === 'properties' ? (
              <>
                {/* Content / Expression Field */}
                <DataSourceAutocomplete
                  value={selectedComp.value}
                  onChange={(val) => onUpdateSelected('value', val)}
                  allFields={allFields}
                  label="Content / Bound Expression"
                  placeholder="Ketik teks atau ekspresi, e.g. items.[0].name"
                />

                {/* Coordinates */}
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Canvas Position (px)
                  </label>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">X</span>
                      <input
                        type="number"
                        value={selectedComp.x}
                        onChange={(e) => onUpdateSelected('x', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-[#07090e] border border-white/10 rounded-xl text-white outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Y</span>
                      <input
                        type="number"
                        value={selectedComp.y}
                        onChange={(e) => onUpdateSelected('y', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-[#07090e] border border-white/10 rounded-xl text-white outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Width</span>
                      <input
                        type="number"
                        value={selectedComp.width}
                        onChange={(e) => onUpdateSelected('width', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-[#07090e] border border-white/10 rounded-xl text-white outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Height</span>
                      <input
                        type="number"
                        value={selectedComp.height}
                        onChange={(e) => onUpdateSelected('height', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-[#07090e] border border-white/10 rounded-xl text-white outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Layering & Z-Index Controls */}
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Layering (Z-Index)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={selectedComp.zIndex ?? 1}
                      onChange={(e) => onUpdateSelected('zIndex', Number(e.target.value))}
                      className="w-16 px-2.5 py-1.5 bg-[#07090e] border border-white/10 rounded-xl text-white font-mono text-xs text-center outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateSelected('zIndex', (selectedComp.zIndex ?? 1) + 10)}
                      className="flex-1 py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-slate-200 transition"
                    >
                      Bring Forward
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSelected('zIndex', Math.max(0, (selectedComp.zIndex ?? 1) - 10))}
                      className="flex-1 py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-slate-200 transition"
                    >
                      Send Backward
                    </button>
                  </div>
                </div>

                {/* Overlap Freedom Toggle */}
                <div className="p-3 bg-[#0e131f] border border-white/[0.08] rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">Allow Overlap</span>
                    <span className="text-[10px] text-slate-400">Do not push down when table expands</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSelected('allowOverlap', !selectedComp.allowOverlap)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                      selectedComp.allowOverlap ? 'bg-sky-500' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        selectedComp.allowOverlap ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Report Band Section */}
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Report Band Section
                  </label>
                  <select
                    value={selectedComp.section}
                    onChange={(e) => onUpdateSelected('section', e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#07090e] border border-white/10 rounded-xl text-white outline-none focus:border-sky-500 text-xs"
                  >
                    <option value="PageHeader">PageHeader (Top of Every Page)</option>
                    <option value="ReportHeader">ReportHeader (Page 1 Top)</option>
                    <option value="Detail">Detail (Content / Dynamic Rows)</option>
                    <option value="PageFooter">PageFooter (Bottom of Every Page)</option>
                  </select>
                </div>
              </>
            ) : (
              /* Styling Tab */
              <>
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Typography & Weight
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => onUpdateSelected('fontWeight', selectedComp.fontWeight === 'bold' ? 'normal' : 'bold')}
                      className={`p-2 rounded-xl border transition ${
                        selectedComp.fontWeight === 'bold'
                          ? 'bg-white text-slate-950 font-bold border-white'
                          : 'border-white/10 text-slate-400 hover:text-white bg-[#07090e]'
                      }`}
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSelected('fontStyle', selectedComp.fontStyle === 'italic' ? 'normal' : 'italic')}
                      className={`p-2 rounded-xl border transition ${
                        selectedComp.fontStyle === 'italic'
                          ? 'bg-white text-slate-950 border-white'
                          : 'border-white/10 text-slate-400 hover:text-white bg-[#07090e]'
                      }`}
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex bg-[#07090e] border border-white/10 rounded-xl p-0.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => onUpdateSelected('textAlign', 'left')}
                        className={`p-1.5 rounded-lg ${selectedComp.textAlign === 'left' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateSelected('textAlign', 'center')}
                        className={`p-1.5 rounded-lg ${selectedComp.textAlign === 'center' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateSelected('textAlign', 'right')}
                        className={`p-1.5 rounded-lg ${selectedComp.textAlign === 'right' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="text-[10px] text-slate-400 font-mono">Font Size (pt)</span>
                    <input
                      type="number"
                      value={selectedComp.fontSize}
                      onChange={(e) => onUpdateSelected('fontSize', Number(e.target.value))}
                      className="w-16 px-2.5 py-1 bg-[#07090e] border border-white/10 rounded-lg text-white font-mono text-center outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.08]">
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedComp.color}
                        onChange={(e) => onUpdateSelected('color', e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={selectedComp.color}
                        onChange={(e) => onUpdateSelected('color', e.target.value)}
                        className="w-full px-2 py-1 bg-[#07090e] border border-white/10 rounded-lg text-white font-mono text-[10px] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Background
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedComp.backgroundColor === 'transparent' ? '#ffffff' : selectedComp.backgroundColor}
                        onChange={(e) => onUpdateSelected('backgroundColor', e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={selectedComp.backgroundColor}
                        onChange={(e) => onUpdateSelected('backgroundColor', e.target.value)}
                        className="w-full px-2 py-1 bg-[#07090e] border border-white/10 rounded-lg text-white font-mono text-[10px] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Quick Actions (Duplicate / Delete) */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onDuplicate}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-medium transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-medium transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
