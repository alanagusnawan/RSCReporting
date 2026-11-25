import React from 'react';
import { ComponentItem, DataConfig, TableColumnConfig } from '../types';
import { SchemaFieldItem } from '../schemaHelper';
import { DataSourceAutocomplete } from '../DataSourceAutocomplete';
import { Plus, Trash2, Eye, EyeOff, Database } from 'lucide-react';

interface DataConfigEditorProps {
  component: ComponentItem;
  allFields: SchemaFieldItem[];
  dataSourceName: string;
  onUpdateDataConfig: (field: keyof DataConfig, val: any) => void;
}

export function DataConfigEditor({
  component,
  allFields,
  dataSourceName,
  onUpdateDataConfig,
}: DataConfigEditorProps) {
  const dataConfig = component.dataConfig || { mode: 'manual' };
  const isDataSource = dataConfig.mode === 'dataSource';
  const type = component.type;

  // Columns for DataGrid/Table
  const columns: TableColumnConfig[] = dataConfig.columns || [
    { id: 'c1', title: 'Product Name', field: 'name', width: 220, visible: true },
    { id: 'c2', title: 'Qty', field: 'quantity', width: 60, visible: true },
    { id: 'c3', title: 'Price', field: 'price', width: 120, visible: true },
    { id: 'c4', title: 'Subtotal', field: 'price', width: 140, visible: true },
  ];

  const updateColumn = (colId: string, updates: Partial<TableColumnConfig>) => {
    const updated = columns.map((c) => (c.id === colId ? { ...c, ...updates } : c));
    onUpdateDataConfig('columns', updated);
  };

  const addColumn = () => {
    const newCol: TableColumnConfig = {
      id: `col_${Date.now()}`,
      title: 'New Column',
      field: 'name',
      width: 100,
      visible: true,
    };
    onUpdateDataConfig('columns', [...columns, newCol]);
  };

  const removeColumn = (colId: string) => {
    onUpdateDataConfig('columns', columns.filter((c) => c.id !== colId));
  };

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Mode Switch: Manual vs Data Source */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Mode Sumber Data
        </label>
        <div className="flex bg-slate-900 p-0.5 rounded border border-slate-800">
          <button
            type="button"
            onClick={() => onUpdateDataConfig('mode', 'manual')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
              !isDataSource ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual
          </button>
          <button
            type="button"
            onClick={() => onUpdateDataConfig('mode', 'dataSource')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
              isDataSource ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Data Source
          </button>
        </div>
      </div>

      {isDataSource && (
        <div className="p-2.5 rounded-lg bg-indigo-950/50 border border-indigo-800/60 text-[11px] text-indigo-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5 truncate">
            <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">Sumber: <strong>{dataSourceName}</strong></span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">Tersambung</span>
        </div>
      )}

      {/* 1. TABLE / DATA GRID CONFIGURATION */}
      {(type === 'DataGrid' || type === 'Table' || type === 'Spreadsheet' || type === 'PivotGrid') && (
        <div className="flex flex-col gap-3">
          {/* Toggle Show Summary / Total Row */}
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block">Tampilkan Baris Total / Summary</span>
              <span className="text-[10px] text-slate-500">Hilangkan jika tabel tidak memerlukan subtotal</span>
            </div>
            <button
              type="button"
              onClick={() => onUpdateDataConfig('showSummary', !dataConfig.showSummary)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                dataConfig.showSummary !== false ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  dataConfig.showSummary !== false ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {dataConfig.showSummary !== false && (
            <div>
              <DataSourceAutocomplete
                value={dataConfig.summaryExpression || '=Sum(Fields.price)'}
                onChange={(val) => onUpdateDataConfig('summaryExpression', val)}
                allFields={allFields}
                label="Rumus Total / Summary Expression"
                placeholder="=Sum(Fields.price) atau =Sum(Fields.items.[0].price)"
                singleLine={true}
              />
            </div>
          )}

          {/* Columns Editor with manual width (px) and free text expression */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                Pengaturan Kolom ({columns.length})
              </label>
              <button
                type="button"
                onClick={addColumn}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900"
              >
                <Plus className="w-3 h-3" /> Tambah Kolom
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {columns.map((col) => (
                <div key={col.id} className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={col.title}
                      onChange={(e) => updateColumn(col.id, { title: e.target.value })}
                      placeholder="Header Title"
                      className="flex-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-100 font-semibold text-xs"
                    />

                    {/* Width input in pixels */}
                    <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                      <span className="text-slate-500">W:</span>
                      <input
                        type="number"
                        value={col.width || 100}
                        onChange={(e) => updateColumn(col.id, { width: Number(e.target.value) || 50 })}
                        className="w-14 px-1.5 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 text-center"
                        title="Lebar kolom dalam pixels (px)"
                      />
                      <span className="text-slate-500">px</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateColumn(col.id, { visible: col.visible === false ? true : false })}
                      className="p-1 text-slate-400 hover:text-white"
                      title={col.visible !== false ? 'Sembunyikan Kolom' : 'Tampilkan Kolom'}
                    >
                      {col.visible !== false ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeColumn(col.id)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="Hapus Kolom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Free text field expression supporting +, -, *, / with hints */}
                  <DataSourceAutocomplete
                    value={col.field}
                    onChange={(val) => updateColumn(col.id, { field: val })}
                    allFields={allFields}
                    placeholder="e.g. price atau =Fields.quantity * Fields.price"
                    singleLine={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. CHARTS CONFIGURATION */}
      {component.type.includes('Chart') && (
        <div className="flex flex-col gap-3">
          {isDataSource ? (
            <>
              <div>
                <label className="text-slate-400 font-medium block mb-1">Data Path Array</label>
                <input
                  type="text"
                  value={dataConfig.dataPath || 'items'}
                  onChange={(e) => onUpdateDataConfig('dataPath', e.target.value)}
                  placeholder="e.g. items, records"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono text-xs"
                />
              </div>

              {/* Free text autocomplete supporting math for Category Field */}
              <DataSourceAutocomplete
                value={dataConfig.categoryField || 'name'}
                onChange={(val) => onUpdateDataConfig('categoryField', val)}
                allFields={allFields}
                label="Category Field (Label X-Axis)"
                placeholder="e.g. name atau =Fields.items.[0].name"
                singleLine={true}
              />

              {/* Free text autocomplete supporting math for Value Field (e.g. price * quantity) */}
              <DataSourceAutocomplete
                value={dataConfig.valueField || 'price'}
                onChange={(val) => onUpdateDataConfig('valueField', val)}
                allFields={allFields}
                label="Value Field (Series Y-Axis / Math)"
                placeholder="e.g. price atau =Fields.price * Fields.quantity"
                singleLine={true}
              />
            </>
          ) : (
            <>
              <div>
                <label className="text-slate-400 font-medium block mb-1">Static Labels (koma)</label>
                <input
                  type="text"
                  value={dataConfig.staticLabels?.join(', ') || 'Q1, Q2, Q3, Q4'}
                  onChange={(e) =>
                    onUpdateDataConfig('staticLabels', e.target.value.split(',').map((s) => s.trim()))
                  }
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium block mb-1">Static Values (angka koma)</label>
                <input
                  type="text"
                  value={dataConfig.staticValues?.join(', ') || '120, 240, 180, 320'}
                  onChange={(e) =>
                    onUpdateDataConfig(
                      'staticValues',
                      e.target.value.split(',').map((s) => Number(s.trim()) || 0)
                    )
                  }
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono text-xs"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. GAUGES CONFIGURATION */}
      {component.type.includes('Gauge') && (
        <div className="flex flex-col gap-3">
          {isDataSource ? (
            <DataSourceAutocomplete
              value={dataConfig.valueExpression || '=Avg(Fields.items.[0].price)'}
              onChange={(val) => onUpdateDataConfig('valueExpression', val)}
              allFields={allFields}
              label="Gauge Value Expression"
              placeholder="e.g. =Avg(Fields.score) atau =Sum(Fields.items.[0].price)"
              singleLine={true}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Target Value</label>
                <input
                  type="number"
                  value={dataConfig.target ?? 80}
                  onChange={(e) => onUpdateDataConfig('target', Number(e.target.value))}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium block mb-1">Unit</label>
                <input
                  type="text"
                  value={dataConfig.unit || '%'}
                  onChange={(e) => onUpdateDataConfig('unit', e.target.value)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
