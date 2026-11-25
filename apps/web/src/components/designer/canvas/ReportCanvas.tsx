import React from 'react';
import { ComponentItem, PageSettingsConfig } from '../types';
import { renderCanvasWidget } from '../CanvasWidgetRenderer';

interface ReportCanvasProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  pageSettings: PageSettingsConfig;
  components: ComponentItem[];
  selectedId: string;
  editingId: string | null;
  zoom: number;
  showGrid: boolean;
  gridSize: number;
  activeDataSourceSample: any;
  onCanvasBackgroundMouseDown: (e: React.MouseEvent) => void;
  onMouseDownOnComp: (e: React.MouseEvent, comp: ComponentItem) => void;
  onMouseDownOnHandle: (e: React.MouseEvent, comp: ComponentItem, handle: 'se' | 'e' | 's') => void;
  onComponentDoubleClick: (comp: ComponentItem) => void;
  onUpdateSelectedValue: (val: string) => void;
  onFinishInlineEdit: () => void;
}

export function ReportCanvas({
  canvasRef,
  pageSettings,
  components,
  selectedId,
  editingId,
  zoom,
  showGrid,
  gridSize,
  activeDataSourceSample,
  onCanvasBackgroundMouseDown,
  onMouseDownOnComp,
  onMouseDownOnHandle,
  onComponentDoubleClick,
  onUpdateSelectedValue,
  onFinishInlineEdit,
}: ReportCanvasProps) {
  // Convert mm to pixels: 1mm = 3.78px at 96 DPI
  const canvasWidthPx = Math.round(pageSettings.width * 3.78);
  const canvasMinHeightPx = Math.round(pageSettings.height * 3.78);

  return (
    <main
      onMouseDown={onCanvasBackgroundMouseDown}
      className="canvas-unclick-surface flex-1 overflow-auto bg-slate-900/95 p-8 flex justify-center items-start cursor-default"
    >
      <div
        ref={canvasRef}
        onMouseDown={onCanvasBackgroundMouseDown}
        style={{
          width: `${canvasWidthPx}px`,
          minHeight: `${canvasMinHeightPx}px`,
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out, width 0.2s ease-out, min-height 0.2s ease-out',
        }}
        className="bg-white text-slate-900 rounded shadow-2xl relative border border-slate-700/60 overflow-hidden"
      >
        {/* Background Grid Pattern */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.08]"
            style={{
              backgroundImage: `radial-gradient(#000000 1.2px, transparent 1.2px)`,
              backgroundSize: `${gridSize * 2}px ${gridSize * 2}px`,
            }}
          />
        )}

        {/* Page Margin Outlines */}
        <div
          style={{
            top: `${pageSettings.margins.top * 3.78}px`,
            bottom: `${pageSettings.margins.bottom * 3.78}px`,
            left: `${pageSettings.margins.left * 3.78}px`,
            right: `${pageSettings.margins.right * 3.78}px`,
          }}
          className="absolute pointer-events-none border border-dashed border-indigo-300/40"
        />

        {/* 1. PageHeader Visual Band Zone */}
        <div
          style={{
            top: `${pageSettings.margins.top * 3.78}px`,
            left: `${pageSettings.margins.left * 3.78}px`,
            right: `${pageSettings.margins.right * 3.78}px`,
            height: `${(pageSettings.headerHeight ?? 20) * 3.78}px`,
          }}
          className={`absolute pointer-events-none ${
            pageSettings.headerBorderBottom !== false ? 'border-b-2 border-dashed border-indigo-400/80' : ''
          } bg-indigo-500/[0.03] flex items-start justify-between p-2 select-none`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">
              PAGE HEADER ({pageSettings.headerHeight ?? 20} mm)
            </span>
            <span className="text-[9px] font-mono text-indigo-500 bg-white/80 px-1.5 py-0.5 rounded border border-indigo-100">
              {pageSettings.headerRepeatMode === 'skipFirst'
                ? 'Repeat: Hal. 2+'
                : pageSettings.headerRepeatMode === 'odd'
                ? 'Repeat: Ganjil'
                : pageSettings.headerRepeatMode === 'even'
                ? 'Repeat: Genap'
                : 'Repeat: Tiap Halaman'}
            </span>
          </div>
          <span className="text-[9px] font-mono text-indigo-400">
            {pageSettings.paperSize} ({pageSettings.orientation.toUpperCase()}: {pageSettings.width} × {pageSettings.height} mm)
          </span>
        </div>

        {/* 2. Content / Detail Visual Watermark */}
        <div
          style={{
            top: `${(pageSettings.margins.top + (pageSettings.headerHeight ?? 20)) * 3.78 + 8}px`,
            left: `${pageSettings.margins.left * 3.78 + 8}px`,
          }}
          className="absolute pointer-events-none select-none flex items-center gap-2"
        >
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200">
            CONTENT / DETAIL (Mengalir ke Halaman 2, 3...)
          </span>
        </div>

        {/* 3. PageFooter Visual Band Zone */}
        <div
          style={{
            bottom: `${pageSettings.margins.bottom * 3.78}px`,
            left: `${pageSettings.margins.left * 3.78}px`,
            right: `${pageSettings.margins.right * 3.78}px`,
            height: `${(pageSettings.footerHeight ?? 15) * 3.78}px`,
          }}
          className={`absolute pointer-events-none ${
            pageSettings.footerBorderTop !== false ? 'border-t-2 border-dashed border-emerald-400/80' : ''
          } bg-emerald-500/[0.03] flex items-center justify-between p-2 select-none`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
              PAGE FOOTER ({pageSettings.footerHeight ?? 15} mm)
            </span>
            <span className="text-[9px] font-mono text-emerald-600 bg-white/80 px-1.5 py-0.5 rounded border border-emerald-100">
              {pageSettings.footerRepeatMode === 'skipLast' ? 'Repeat: Kecuali Akhir' : 'Repeat: Tiap Halaman'}
            </span>
          </div>
          {pageSettings.footerShowPageNumber !== false && (
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {pageSettings.footerPageNumberFormat === 'dashPage'
                ? '- [PageNumber] -'
                : pageSettings.footerPageNumberFormat === 'pageOnly'
                ? 'Page [PageNumber]'
                : 'Page [PageNumber] of [TotalPages]'}
            </span>
          )}
        </div>

        {/* Canvas Components */}
        {components.map((comp) => {
          const isSelected = comp.id === selectedId;
          const isEditing = comp.id === editingId;

          return (
            <div
              key={comp.id}
              onMouseDown={(e) => onMouseDownOnComp(e, comp)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onComponentDoubleClick(comp);
              }}
              style={{
                left: `${comp.x}px`,
                top: `${comp.y}px`,
                width: `${comp.width}px`,
                height: `${comp.height}px`,
                fontSize: `${comp.fontSize}pt`,
                fontWeight: comp.fontWeight,
                fontStyle: comp.fontStyle,
                textAlign: comp.textAlign,
                color: comp.color,
                backgroundColor: comp.backgroundColor,
                borderWidth: `${comp.borderWidth || 0}px`,
                borderColor: comp.borderColor || 'transparent',
                borderRadius: `${comp.borderRadius || 0}px`,
                zIndex: isSelected ? 30 : comp.zIndex ?? 1,
              }}
              className={`absolute p-1 cursor-move transition-shadow ${
                isSelected ? 'ring-2 ring-indigo-600 bg-indigo-50/20 shadow-md' : 'hover:ring-1 hover:ring-slate-300'
              }`}
            >
              {isEditing ? (
                <input
                  type="text"
                  autoFocus
                  value={comp.value}
                  onChange={(e) => onUpdateSelectedValue(e.target.value)}
                  onBlur={onFinishInlineEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onFinishInlineEdit();
                  }}
                  className="w-full h-full bg-white text-slate-900 border border-indigo-500 rounded px-1 outline-none font-inherit text-inherit"
                />
              ) : (
                renderCanvasWidget(comp, isSelected, activeDataSourceSample)
              )}

              {/* Resizing Handles */}
              {isSelected && (
                <>
                  <div
                    onMouseDown={(e) => onMouseDownOnHandle(e, comp, 'se')}
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-indigo-600 border border-white rounded-xs cursor-se-resize z-20"
                    title="Resize Corner"
                  />
                  <div
                    onMouseDown={(e) => onMouseDownOnHandle(e, comp, 'e')}
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-3 bg-indigo-600 border border-white rounded-xs cursor-e-resize z-20"
                    title="Resize Width"
                  />
                  <div
                    onMouseDown={(e) => onMouseDownOnHandle(e, comp, 's')}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-2.5 bg-indigo-600 border border-white rounded-xs cursor-s-resize z-20"
                    title="Resize Height"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
