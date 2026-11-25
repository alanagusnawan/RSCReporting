import React from 'react';
import { ComponentItem } from './types';
import {
  Grid,
  Activity,
  Gauge,
  Tag,
  PieChart,
  BarChart,
  LineChart,
  TrendingUp,
  Workflow,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Database,
  Sliders,
  Barcode,
  QrCode,
  Compass,
  Image as ImageIcon
} from 'lucide-react';

export function renderCanvasWidget(comp: ComponentItem, isSelected: boolean, activeDataSourceSample?: any) {
  const type = comp.type;
  const dataConfig = comp.dataConfig;

  // Resolve data values for charts
  let chartLabels: string[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  let chartValues: number[] = [120, 240, 180, 320];

  if (dataConfig?.mode === 'dataSource' && activeDataSourceSample) {
    const dataPath = dataConfig.dataPath || 'items';
    const rows = Array.isArray(activeDataSourceSample[dataPath])
      ? activeDataSourceSample[dataPath]
      : Array.isArray(activeDataSourceSample)
      ? activeDataSourceSample
      : [];

    if (rows.length > 0) {
      const catKey = dataConfig.categoryField?.replace(/^(=Fields\.|\=)/, '') || 'name';
      const valKey = dataConfig.valueField?.replace(/^(=Fields\.|\=)/, '') || 'price';

      chartLabels = rows.map((r: any) => String(r[catKey] ?? 'Item'));
      chartValues = rows.map((r: any) => {
        const v = Number(r[valKey]);
        return isNaN(v) ? 10 : v;
      });
    }
  } else if (dataConfig?.mode === 'manual' && dataConfig.staticLabels && dataConfig.staticValues) {
    chartLabels = dataConfig.staticLabels;
    chartValues = dataConfig.staticValues;
  }

  // 1. Charts
  if (
    type.includes('Chart') ||
    type === 'DonutChart' ||
    type === 'PieChart' ||
    type === 'Sparkline' ||
    type === 'Drilldown' ||
    type === 'Waterfall' ||
    type === 'SankeyDiagram'
  ) {
    const isPie = type === 'PieChart' || type === 'DonutChart';
    const maxValue = Math.max(...chartValues, 10);
    const total = chartValues.reduce((a, b) => a + b, 0) || 1;

    return (
      <div className="w-full h-full bg-slate-950/90 border border-slate-800 rounded-lg p-3 flex flex-col justify-between overflow-hidden shadow-inner">
        <div className="flex justify-between items-center text-xs font-bold text-slate-200 border-b border-slate-800/80 pb-1.5">
          <span className="flex items-center gap-1.5 truncate">
            {isPie ? <PieChart className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> : <BarChart className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
            <span className="truncate">{comp.name}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
            {dataConfig?.mode === 'dataSource' ? (
              <span className="text-emerald-400 flex items-center gap-0.5"><Database className="w-2.5 h-2.5" /> DS</span>
            ) : (
              <span className="text-slate-400">Manual</span>
            )}
          </span>
        </div>

        {/* Dynamic Vector Graphic based on values */}
        <div className="flex-1 flex items-center justify-center py-2 px-1">
          {isPie ? (
            <svg viewBox="0 0 100 100" className="w-24 h-24">
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" strokeWidth={type === 'DonutChart' ? '18' : '38'} strokeDasharray="150 250" />
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth={type === 'DonutChart' ? '18' : '38'} strokeDasharray="60 250" strokeDashoffset="-150" />
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" strokeWidth={type === 'DonutChart' ? '18' : '38'} strokeDasharray="40 250" strokeDashoffset="-210" />
            </svg>
          ) : (
            <div className="w-full h-full max-h-24 flex items-end justify-between gap-1.5 pt-2">
              {chartValues.slice(0, 6).map((val, idx) => {
                const heightPct = Math.max(12, Math.min(95, Math.round((val / maxValue) * 90)));
                const label = chartLabels[idx] || `Item ${idx + 1}`;
                const colors = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                const bg = colors[idx % colors.length];

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[9px] text-slate-400 font-mono mb-0.5 opacity-80">{val}</span>
                    <div
                      style={{ height: `${heightPct}%`, backgroundColor: bg }}
                      className="w-full rounded-t-xs transition-all"
                    />
                    <span className="text-[9px] text-slate-500 font-mono mt-1 truncate max-w-[45px] text-center">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-900">
          <span className="truncate">{chartLabels.slice(0, 3).join(', ')}</span>
          <span className="text-indigo-400">Total: {total.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  // 2. Gauges
  if (type.includes('Gauge')) {
    let currentGaugeVal = dataConfig?.target ?? 80;
    const minVal = dataConfig?.min ?? 0;
    const maxVal = dataConfig?.max ?? 100;
    const unit = dataConfig?.unit || '%';

    if (dataConfig?.mode === 'dataSource' && activeDataSourceSample) {
      if (dataConfig.valueExpression) {
        currentGaugeVal = 75;
      }
    }

    const pct = Math.min(100, Math.max(0, ((currentGaugeVal - minVal) / (maxVal - minVal)) * 100));

    return (
      <div className="w-full h-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between items-center text-center shadow-inner">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Gauge className="w-3 h-3 text-indigo-400" />
          <span>{comp.name}</span>
        </div>
        <div className="relative flex items-center justify-center my-1">
          <svg viewBox="0 0 100 60" className="w-22 h-14">
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#6366f1"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 125} 125`}
            />
          </svg>
          <span className="absolute bottom-0 font-bold text-sm text-white">
            {currentGaugeVal}{unit}
          </span>
        </div>
        <div className="text-[9px] text-slate-500 font-mono flex justify-between w-full px-2">
          <span>{minVal}{unit}</span>
          <span className="text-indigo-400 font-semibold">{dataConfig?.mode === 'dataSource' ? 'Linked' : 'Fixed'}</span>
          <span>{maxVal}{unit}</span>
        </div>
      </div>
    );
  }

  // 3. Data Grid / Spreadsheets (DESIGN-TIME VIEW: Menampilkan field / ekspresi, BUKAN data dummy)
  if (type === 'DataGrid' || type === 'Table' || type === 'Spreadsheet' || type === 'PivotGrid' || type === 'TreeList') {
    const rawColumns = dataConfig?.columns || [
      { id: 'c1', title: 'Product Name', field: 'name', width: 220, visible: true },
      { id: 'c2', title: 'Qty', field: 'quantity', width: 60, visible: true },
      { id: 'c3', title: 'Price', field: 'price', width: 120, visible: true },
      { id: 'c4', title: 'Total', field: '=Fields.price * Fields.quantity', width: 140, visible: true },
    ];

    // Filter visible columns only
    const columns = rawColumns.filter(c => c.visible !== false);
    const showSummary = dataConfig?.showSummary !== false;

    // Helper format expression/field for design-time row
    const formatFieldText = (rawField: string) => {
      if (!rawField) return '[field]';
      const clean = rawField.trim();
      if (clean.startsWith('=')) return clean;
      if (clean.includes('*') || clean.includes('+') || clean.includes('-') || clean.includes('/')) {
        return `=${clean}`;
      }
      return `=Fields.${clean}`;
    };

    return (
      <div className="h-full border border-slate-300 bg-slate-50 flex flex-col justify-between text-xs rounded shadow-xs overflow-hidden">
        {/* Table Header: Menampilkan Title Kolom */}
        <div className="flex border-b border-slate-300 font-bold text-slate-800 bg-slate-100/90 text-[11px] select-none">
          {columns.map(c => (
            <div
              key={c.id}
              style={{ width: c.width ? `${c.width}px` : undefined }}
              className="px-2.5 py-1.5 truncate border-r border-slate-200/80 last:border-r-0 flex-1"
            >
              {c.title}
            </div>
          ))}
        </div>

        {/* Single Definition Row: Menampilkan Field / Formula Ekspresinya Langsung (Bukan Data Dummy) */}
        <div className="flex-1 flex flex-col justify-center bg-white p-1">
          <div className="flex items-center text-[10px] text-indigo-700 bg-indigo-50/60 border border-indigo-200/80 rounded py-1.5 font-mono">
            {columns.map((c, cellIdx) => (
              <div
                key={cellIdx}
                style={{ width: c.width ? `${c.width}px` : undefined }}
                className="px-2 truncate border-r border-indigo-200/50 last:border-r-0 flex-1"
                title={`Bound expression: ${formatFieldText(c.field)}`}
              >
                {formatFieldText(c.field)}
              </div>
            ))}
          </div>
          <div className="text-[9px] text-slate-400 italic text-center mt-1">
            (Detail Section: Baris data aktual dihitung otomatis saat generate PDF)
          </div>
        </div>

        {/* Optional Total / Summary Row */}
        {showSummary && (
          <div className="flex justify-between border-t border-slate-300 px-3 py-1.5 font-semibold text-slate-900 bg-slate-100/95 text-[10px]">
            <span>Total / Summary</span>
            <span className="font-mono text-indigo-700">
              {dataConfig?.summaryExpression || '=Sum(Fields.price)'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 4. Barcodes & Media
  if (type === 'Barcode') {
    return (
      <div className="w-full h-full border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-1 rounded shadow-xs">
        <Barcode className="w-full h-6 text-slate-800" />
        <span className="font-mono text-[9px] text-slate-600 mt-0.5">{comp.value || '123456789012'}</span>
      </div>
    );
  }

  if (type === 'QrCode') {
    return (
      <div className="w-full h-full border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-1.5 rounded shadow-xs">
        <QrCode className="w-full h-full text-slate-900 max-h-16 max-w-16" />
      </div>
    );
  }

  if (type === 'PictureBox') {
    return (
      <div className="w-full h-full border border-slate-200 bg-slate-100/80 rounded flex items-center justify-center p-1 overflow-hidden">
        {comp.value?.startsWith('http') ? (
          <img src={comp.value} alt="logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <ImageIcon className="w-4 h-4 text-slate-400" />
            <span>PictureBox Logo</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'Map') {
    return (
      <div className="w-full h-full bg-slate-100 border border-slate-300 rounded p-2 flex flex-col justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700">
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          <span>Geo Map Location</span>
        </div>
        <div className="text-[10px] font-mono text-slate-500">{comp.value || 'Jakarta (-6.2, 106.8)'}</div>
      </div>
    );
  }

  // 5. Badges
  if (type === 'Badge') {
    return (
      <div className="w-full h-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 rounded-full font-bold text-[10px] flex items-center justify-center px-2">
        {comp.value || 'ACTIVE'}
      </div>
    );
  }

  // Default fallback for regular text, inputs, line, shape
  return (
    <div className="w-full h-full truncate leading-tight select-none flex items-center">
      {comp.value}
    </div>
  );
}
