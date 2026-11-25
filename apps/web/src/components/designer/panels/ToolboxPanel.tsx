'use client';

import React from 'react';
import { Layers, Search, ChevronDown, Sparkles } from 'lucide-react';
import { CatalogItem } from '../ComponentRegistry';

interface ToolboxPanelProps {
  categories: string[];
  filteredCatalog: CatalogItem[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  expandedCategories: Record<string, boolean>;
  onToggleCategory: (c: string) => void;
  onAddFromCatalog: (item: CatalogItem) => void;
}

export function ToolboxPanel({
  categories,
  filteredCatalog,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  expandedCategories,
  onToggleCategory,
  onAddFromCatalog,
}: ToolboxPanelProps) {
  return (
    <aside className="w-72 bg-[#090d16] border-r border-white/[0.08] flex flex-col shrink-0 overflow-hidden">
      {/* Top Search & Filter Strip */}
      <div className="p-3.5 border-b border-white/[0.08] flex flex-col gap-2.5 bg-[#090d16] shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Component Suite</span>
          </span>
          <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
            {filteredCatalog.length}
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search component (Chart, Grid, Barcode)..."
            className="w-full bg-[#07090e] border border-white/10 rounded-full pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500/80 transition"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] scrollbar-none">
          {['All', 'Data Grid & Tables', 'Charts', 'Gauges & KPIs', 'Barcodes & Media', 'Text & Headings', 'Inputs & Form Controls', 'Layout & Shapes'].map(
            (cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat === 'Data Grid & Tables' ? 'Tables' : cat === 'Gauges & KPIs' ? 'Gauges' : cat === 'Barcodes & Media' ? 'Barcodes' : cat === 'Inputs & Form Controls' ? 'Inputs' : cat === 'Layout & Shapes' ? 'Layout' : cat === 'Text & Headings' ? 'Text' : cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Categorized Component List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {categories.map((category) => {
          const items = filteredCatalog.filter((c) => c.category === category);
          if (items.length === 0) return null;

          const isExpanded =
            searchTerm.trim() !== '' || selectedCategory !== 'All'
              ? true
              : (expandedCategories[category] ?? false);

          return (
            <div key={category} className="border border-white/[0.06] rounded-xl overflow-hidden bg-[#0e131f]/70">
              <button
                type="button"
                onClick={() => onToggleCategory(category)}
                className="w-full px-3 py-2 bg-[#0e131f] flex items-center justify-between text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.02] transition"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
                  <span className="truncate">{category}</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-[10px] font-mono text-slate-500">{items.length}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="p-2 grid grid-cols-1 gap-1.5 bg-[#07090e]/60 border-t border-white/[0.04]">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        type="button"
                        key={item.type}
                        onClick={() => onAddFromCatalog(item)}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-left bg-white/[0.02] border border-white/[0.05] hover:border-sky-500/40 hover:bg-white/[0.04] transition-all group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-sky-400 group-hover:scale-105 transition shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="block text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                            {item.label}
                          </span>
                          <span className="block text-[10px] text-slate-500 leading-tight truncate">
                            {item.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
