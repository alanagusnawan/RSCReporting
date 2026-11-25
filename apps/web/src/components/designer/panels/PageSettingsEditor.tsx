'use client';

import React from 'react';
import { PageSettingsConfig } from '../types';
import { FileText, SlidersHorizontal, ArrowUpDown, Repeat, Hash, AlignRight, AlignCenter, AlignLeft, Layers } from 'lucide-react';

interface PageSettingsEditorProps {
  pageSettings: PageSettingsConfig;
  onPaperSizeChange: (size: PageSettingsConfig['paperSize']) => void;
  onOrientationToggle: (orient: 'portrait' | 'landscape') => void;
  onUpdateSettings: (updater: (prev: PageSettingsConfig) => PageSettingsConfig) => void;
}

export function PageSettingsEditor({
  pageSettings,
  onPaperSizeChange,
  onOrientationToggle,
  onUpdateSettings,
}: PageSettingsEditorProps) {
  return (
    <div className="flex flex-col gap-4 text-xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
        <span className="font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <span>Paper & Dimensions</span>
        </span>
        <span className="font-mono text-[10px] text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
          {pageSettings.paperSize}
        </span>
      </div>

      <div>
        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
          Preset Paper Size
        </label>
        <select
          value={pageSettings.paperSize}
          onChange={(e) => onPaperSizeChange(e.target.value as any)}
          className="w-full px-3 py-2 bg-[#07090e] border border-white/10 rounded-xl text-white focus:outline-none focus:border-sky-500/80 transition"
        >
          <option value="A4">A4 (210 × 297 mm)</option>
          <option value="A3">A3 (297 × 420 mm)</option>
          <option value="A5">A5 (148 × 210 mm)</option>
          <option value="Letter">Letter (8.5 × 11 in)</option>
          <option value="Legal">Legal (8.5 × 14 in)</option>
          <option value="Custom">Custom Dimensions (mm)</option>
        </select>
      </div>

      <div>
        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
          Orientation
        </label>
        <div className="grid grid-cols-2 gap-2 bg-[#07090e] p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => onOrientationToggle('portrait')}
            className={`py-1.5 px-3 rounded-lg text-center font-medium transition ${
              pageSettings.orientation === 'portrait'
                ? 'bg-white text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Portrait
          </button>
          <button
            type="button"
            onClick={() => onOrientationToggle('landscape')}
            className={`py-1.5 px-3 rounded-lg text-center font-medium transition ${
              pageSettings.orientation === 'landscape'
                ? 'bg-white text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Landscape
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block mb-1">Width (mm)</span>
          <input
            type="number"
            value={pageSettings.width}
            onChange={(e) =>
              onUpdateSettings((prev) => ({ ...prev, width: Number(e.target.value) || 210 }))
            }
            className="w-full px-3 py-1.5 bg-[#07090e] border border-white/10 rounded-xl text-white outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block mb-1">Height (mm)</span>
          <input
            type="number"
            value={pageSettings.height}
            onChange={(e) =>
              onUpdateSettings((prev) => ({ ...prev, height: Number(e.target.value) || 297 }))
            }
            className="w-full px-3 py-1.5 bg-[#07090e] border border-white/10 rounded-xl text-white outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
          Margins (mm)
        </label>
        <div className="grid grid-cols-2 gap-2 font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Top</span>
            <input
              type="number"
              value={pageSettings.margins.top}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  margins: { ...prev.margins, top: Number(e.target.value) || 0 },
                }))
              }
              className="w-full px-3 py-1.5 bg-[#07090e] border border-white/10 rounded-xl text-white outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Bottom</span>
            <input
              type="number"
              value={pageSettings.margins.bottom}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  margins: { ...prev.margins, bottom: Number(e.target.value) || 0 },
                }))
              }
              className="w-full px-3 py-1.5 bg-[#07090e] border border-white/10 rounded-xl text-white outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Left</span>
            <input
              type="number"
              value={pageSettings.margins.left}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  margins: { ...prev.margins, left: Number(e.target.value) || 0 },
                }))
              }
              className="w-full px-3 py-1.5 bg-[#07090e] border border-white/10 rounded-xl text-white outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Right</span>
            <input
              type="number"
              value={pageSettings.margins.right}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  margins: { ...prev.margins, right: Number(e.target.value) || 0 },
                }))
              }
              className="w-full px-3 py-1.5 bg-[#07090e] border border-white/10 rounded-xl text-white outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Advanced PageHeader & PageFooter Bands */}
      <div className="pt-3 border-t border-white/[0.08]">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
            Advanced Header & Footer Bands
          </label>
          <span className="text-[10px] font-mono text-sky-400">Multi-Page Engine</span>
        </div>

        <div className="space-y-3">
          {/* PageHeader Advanced Menu */}
          <div className="p-3.5 bg-[#0e131f] border border-white/[0.08] rounded-2xl space-y-3 glow-card">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>PageHeader Band</span>
              </span>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={pageSettings.headerHeight ?? 20}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      headerHeight: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-16 px-2.5 py-1 bg-[#07090e] border border-white/10 rounded-lg text-white text-right text-xs outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-500">mm</span>
              </div>
            </div>

            {/* Repeat Mode */}
            <div>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1 font-medium">
                <Repeat className="w-3 h-3 text-sky-400" />
                <span>Frekuensi Pengulangan (Repeat Rule):</span>
              </span>
              <select
                value={pageSettings.headerRepeatMode || 'all'}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    headerRepeatMode: e.target.value as any,
                  }))
                }
                className="w-full px-2.5 py-1.5 bg-[#07090e] border border-white/10 rounded-xl text-white text-xs outline-none focus:border-sky-500"
              >
                <option value="all">Ulangi di Setiap Halaman (Halaman 1, 2, 3...)</option>
                <option value="skipFirst">Lewati Halaman 1 (Halaman 2 s/d Terakhir)</option>
                <option value="odd">Hanya Halaman Ganjil (1, 3, 5...)</option>
                <option value="even">Hanya Halaman Genap (2, 4, 6...)</option>
              </select>
            </div>

            {/* Header Options */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.04]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pageSettings.headerBorderBottom !== false}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      headerBorderBottom: e.target.checked,
                    }))
                  }
                  className="rounded border-white/20 bg-[#07090e] text-sky-500 focus:ring-0"
                />
                <span className="text-[11px] text-slate-300">Garis Bawah (Divider)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pageSettings.showHeaderOnFirstPage !== false}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      showHeaderOnFirstPage: e.target.checked,
                    }))
                  }
                  className="rounded border-white/20 bg-[#07090e] text-sky-500 focus:ring-0"
                />
                <span className="text-[11px] text-slate-300">Muncul Hal. 1</span>
              </label>
            </div>
          </div>

          {/* PageFooter Advanced Menu */}
          <div className="p-3.5 bg-[#0e131f] border border-white/[0.08] rounded-2xl space-y-3 glow-card">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>PageFooter Band</span>
              </span>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={pageSettings.footerHeight ?? 15}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      footerHeight: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-16 px-2.5 py-1 bg-[#07090e] border border-white/10 rounded-lg text-white text-right text-xs outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-500">mm</span>
              </div>
            </div>

            {/* Repeat Mode */}
            <div>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1 font-medium">
                <Repeat className="w-3 h-3 text-emerald-400" />
                <span>Frekuensi Pengulangan Footer:</span>
              </span>
              <select
                value={pageSettings.footerRepeatMode || 'all'}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    footerRepeatMode: e.target.value as any,
                  }))
                }
                className="w-full px-2.5 py-1.5 bg-[#07090e] border border-white/10 rounded-xl text-white text-xs outline-none focus:border-sky-500"
              >
                <option value="all">Ulangi di Setiap Halaman (Default)</option>
                <option value="skipLast">Lewati Halaman Terakhir</option>
                <option value="odd">Hanya Halaman Ganjil</option>
                <option value="even">Hanya Halaman Genap</option>
              </select>
            </div>

            {/* Page Numbering Section */}
            <div className="p-2.5 bg-[#07090e] border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nomor Halaman Otomatis</span>
                </span>
                <input
                  type="checkbox"
                  checked={pageSettings.footerShowPageNumber !== false}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      footerShowPageNumber: e.target.checked,
                    }))
                  }
                  className="rounded border-white/20 bg-[#0e131f] text-emerald-500 focus:ring-0"
                />
              </div>

              {pageSettings.footerShowPageNumber !== false && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.04]">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Format:</span>
                    <select
                      value={pageSettings.footerPageNumberFormat || 'pageOfTotal'}
                      onChange={(e) =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          footerPageNumberFormat: e.target.value as any,
                        }))
                      }
                      className="w-full px-2 py-1 bg-[#0e131f] border border-white/10 rounded-lg text-white text-[11px] outline-none"
                    >
                      <option value="pageOfTotal">Page X of Y</option>
                      <option value="pageOnly">Page X</option>
                      <option value="dashPage">- X -</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Posisi:</span>
                    <select
                      value={pageSettings.footerPageNumberAlign || 'right'}
                      onChange={(e) =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          footerPageNumberAlign: e.target.value as any,
                        }))
                      }
                      className="w-full px-2 py-1 bg-[#0e131f] border border-white/10 rounded-lg text-white text-[11px] outline-none"
                    >
                      <option value="right">Kanan</option>
                      <option value="center">Tengah</option>
                      <option value="left">Kiri</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Options */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.04]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pageSettings.footerBorderTop !== false}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      footerBorderTop: e.target.checked,
                    }))
                  }
                  className="rounded border-white/20 bg-[#07090e] text-emerald-500 focus:ring-0"
                />
                <span className="text-[11px] text-slate-300">Garis Atas (Divider)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pageSettings.showFooterOnLastPage !== false}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      showFooterOnLastPage: e.target.checked,
                    }))
                  }
                  className="rounded border-white/20 bg-[#07090e] text-emerald-500 focus:ring-0"
                />
                <span className="text-[11px] text-slate-300">Muncul Hal. Akhir</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
