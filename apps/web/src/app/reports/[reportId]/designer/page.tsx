'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { COMPONENT_CATALOG, CATEGORIES, CatalogItem } from '@/components/designer/ComponentRegistry';
import { ComponentItem, DataConfig, PageSettingsConfig } from '@/components/designer/types';
import { extractSchemaPaths, SchemaFieldItem } from '@/components/designer/schemaHelper';
import { DesignerHeader } from '@/components/designer/panels/DesignerHeader';
import { ToolboxPanel } from '@/components/designer/panels/ToolboxPanel';
import { PropertiesPanel } from '@/components/designer/panels/PropertiesPanel';
import { DataSourceModal } from '@/components/designer/panels/DataSourceModal';
import { AiStudioDrawer } from '@/components/designer/panels/AiStudioDrawer';
import { ReportCanvas } from '@/components/designer/canvas/ReportCanvas';

const DEFAULT_PAGE_SETTINGS: PageSettingsConfig = {
  paperSize: 'A4',
  orientation: 'portrait',
  width: 210,
  height: 297,
  margins: { top: 10, bottom: 10, left: 10, right: 10, unit: 'mm' },
  backgroundColor: '#ffffff',
};

const DEFAULT_COMPONENTS: ComponentItem[] = [];

export default function DesignerPage({ params }: { params: Promise<{ reportId: string }> }) {
  const [reportId, setReportId] = useState<string>('');
  const searchParams = useSearchParams();
  const [components, setComponents] = useState<ComponentItem[]>(DEFAULT_COMPONENTS);
  const [selectedId, setSelectedId] = useState<string>(''); // Default unclicked
  const [editingId, setEditingId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(8);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ message: string; type: 'success' | 'warn' } | null>(null);
  const [dbSource, setDbSource] = useState<'database' | 'memory' | 'loading'>('loading');
  const [activeTab, setActiveTab] = useState<'properties' | 'data' | 'styling' | 'page' | 'ai'>('properties');

  // Page Settings state
  const [pageSettings, setPageSettings] = useState<PageSettingsConfig>(DEFAULT_PAGE_SETTINGS);

  // Search & Catalog Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Charts': true,
    'Data Grid & Tables': true,
    'Gauges & KPIs': true,
    'Text & Headings': true,
    'Barcodes & Media': true,
    'Inputs & Form Controls': true,
    'Layout & Shapes': true,
  });

  // Data Source Dialog State
  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);
  const [dataSourceName, setDataSourceName] = useState('Production Items Data');
  const [dataProviderType, setDataProviderType] = useState<'inline' | 'restApi' | 'jsonFile'>('inline');
  const [dataSourceJson, setDataSourceJson] = useState<string>(
    JSON.stringify(
      {
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
      },
      null,
      2
    )
  );
  const [restApiUrl, setRestApiUrl] = useState('');
  const [isSavingDataSource, setIsSavingDataSource] = useState(false);
  const [dataSourceSuccess, setDataSourceSuccess] = useState<string | null>(null);

  // Extract all fields recursively from active data source
  const [allSchemaFields, setAllSchemaFields] = useState<SchemaFieldItem[]>([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(dataSourceJson);
      const fields = extractSchemaPaths(parsed);
      setAllSchemaFields(fields);
    } catch {
      setAllSchemaFields([]);
    }
  }, [dataSourceJson]);

  // Gemini AI Assistant State
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Halo! Saya asisten Gemini AI untuk Reporting Studio. Saya bisa bantu buatkan komponen, chart, gauge, dan menghubungkan langsung ke data source Anda.',
    },
  ]);
  const [formulaPrompt, setFormulaPrompt] = useState('');
  const [generatedFormula, setGeneratedFormula] = useState('');

  // Dragging & Resizing state
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    isResizing: boolean;
    resizeHandle?: 'se' | 'e' | 's';
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
  }>({
    isDragging: false,
    isResizing: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialW: 0,
    initialH: 0,
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => {
      setReportId(p.reportId);
      loadTemplateFromDatabase(p.reportId);
    });
  }, [params]);

  const loadTemplateFromDatabase = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5488/api/v1/templates/${id}`);
      if (res.ok) {
        const json = await res.json();
        setDbSource(json.source === 'database' ? 'database' : 'memory');

        if (json.definition) {
          if (json.definition.pageSettings) {
            setPageSettings({
              paperSize: json.definition.pageSettings.paperSize || 'A4',
              orientation: json.definition.pageSettings.orientation || 'portrait',
              width: json.definition.pageSettings.width || (json.definition.pageSettings.orientation === 'landscape' ? 297 : 210),
              height: json.definition.pageSettings.height || (json.definition.pageSettings.orientation === 'landscape' ? 210 : 297),
              margins: json.definition.pageSettings.margins || { top: 10, bottom: 10, left: 10, right: 10, unit: 'mm' },
              headerHeight: json.definition.pageSettings.headerHeight ?? 20,
              footerHeight: json.definition.pageSettings.footerHeight ?? 15,
              showHeaderOnFirstPage: json.definition.pageSettings.showHeaderOnFirstPage !== false,
              showFooterOnLastPage: json.definition.pageSettings.showFooterOnLastPage !== false,
            });
          }

          if (json.definition.dataSources && json.definition.dataSources.length > 0) {
            const ds = json.definition.dataSources[0];
            setDataSourceName(ds.name || 'Main Data Source');
            setDataProviderType(ds.type || 'inline');
            if (ds.config && ds.config.sampleData) {
              setDataSourceJson(
                typeof ds.config.sampleData === 'string'
                  ? ds.config.sampleData
                  : JSON.stringify(ds.config.sampleData, null, 2)
              );
            }
          }

          if (json.definition.sections) {
            const loadedComps: ComponentItem[] = [];
            for (const sec of json.definition.sections) {
              if (sec.components) {
                for (const c of sec.components) {
                  loadedComps.push({
                    id: c.id,
                    type: c.type,
                    name: c.name,
                    section: sec.type,
                    x: c.x ?? 0,
                    y: c.y ?? 0,
                    width: c.width || 180,
                    height: c.height || 30,
                    value: c.value || c.text || '',
                    fontSize: c.style?.fontSize || 10,
                    fontWeight: c.style?.fontWeight === 'bold' ? 'bold' : 'normal',
                    fontStyle: c.style?.fontStyle === 'italic' ? 'italic' : 'normal',
                    textAlign: c.style?.textAlign || 'left',
                    color: c.style?.color || '#000000',
                    backgroundColor: c.style?.backgroundColor || 'transparent',
                    category: c.category || 'Text & Headings',
                    dataConfig: c.dataConfig,
                  });
                }
              }
            }
            setComponents(loadedComps);
          } else {
            setComponents([]);
          }
        }
      } else {
        setDbSource('memory');
      }
    } catch {
      setDbSource('memory');
    }
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    let parsedSampleData: any = {};
    try {
      parsedSampleData = JSON.parse(dataSourceJson);
    } catch {}

    const reportDefinition = {
      schemaVersion: '1.0.0',
      reportId,
      name: reportId.replace(/-/g, ' ').toUpperCase(),
      pageSettings: {
        paperSize: pageSettings.paperSize,
        orientation: pageSettings.orientation,
        width: pageSettings.width,
        height: pageSettings.height,
        margins: pageSettings.margins,
        headerHeight: pageSettings.headerHeight ?? 20,
        footerHeight: pageSettings.footerHeight ?? 15,
        showHeaderOnFirstPage: pageSettings.showHeaderOnFirstPage !== false,
        showFooterOnLastPage: pageSettings.showFooterOnLastPage !== false,
      },
      dataSources: [
        {
          id: 'ds_primary',
          name: dataSourceName,
          type: dataProviderType,
          config: {
            endpoint: restApiUrl || undefined,
            sampleData: parsedSampleData,
          },
        },
      ],
      datasets: [{ id: 'mainDataset', name: 'Items', dataPath: 'items' }],
      sections: [
        {
          id: 'sec_page_header',
          name: 'PageHeader',
          type: 'PageHeader',
          height: pageSettings.headerHeight ?? 20,
          components: components.filter((c) => c.section === 'PageHeader'),
        },
        {
          id: 'sec_header',
          name: 'ReportHeader',
          type: 'ReportHeader',
          height: 100,
          components: components.filter((c) => c.section === 'ReportHeader'),
        },
        {
          id: 'sec_detail',
          name: 'Detail',
          type: 'Detail',
          height: 300,
          components: components.filter((c) => c.section === 'Detail'),
        },
        {
          id: 'sec_footer',
          name: 'PageFooter',
          type: 'PageFooter',
          height: pageSettings.footerHeight ?? 15,
          components: components.filter((c) => c.section === 'PageFooter'),
        },
      ],
    };

    try {
      const res = await fetch(`http://localhost:5488/api/v1/templates/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportId,
          definition: reportDefinition,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setDbSource(json.savedTo === 'database' ? 'database' : 'memory');
        setSaveStatus({
          message: json.savedTo === 'database' ? 'Persisted to PostgreSQL database!' : 'Cached in-memory (DB 5435 offline)',
          type: json.savedTo === 'database' ? 'success' : 'warn',
        });
      } else {
        setSaveStatus({ message: 'Save error from API endpoint', type: 'warn' });
      }
    } catch {
      setSaveStatus({ message: 'API unreachable (Make sure apps/api is running on :5488)', type: 'warn' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleSaveDataSourceDialog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDataSource(true);
    setDataSourceSuccess(null);

    let parsedConfig: any = {};
    try {
      parsedConfig = {
        sampleData: JSON.parse(dataSourceJson),
        endpoint: restApiUrl || undefined,
      };
    } catch {
      alert('Invalid JSON in data source config. Please check format.');
      setIsSavingDataSource(false);
      return;
    }

    try {
      const dsId = `ds_${reportId}`;
      await fetch(`http://localhost:5488/api/v1/data-sources/${dsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dataSourceName,
          providerType: dataProviderType,
          configuration: parsedConfig,
        }),
      });

      await handleSaveToDatabase();

      setDataSourceSuccess('Data source saved to PostgreSQL & linked to template!');
      setTimeout(() => {
        setIsDataSourceModalOpen(false);
        setDataSourceSuccess(null);
      }, 1200);
    } catch (err: any) {
      alert('Error saving data source: ' + err.message);
    } finally {
      setIsSavingDataSource(false);
    }
  };

  // AI Gemini Handlers
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptInput.trim()) return;
    setIsAiLoading(true);

    let parsedDS: any = null;
    try {
      parsedDS = JSON.parse(dataSourceJson);
    } catch {}

    try {
      const res = await fetch('http://localhost:5488/api/v1/ai/generate-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPromptInput,
          dataSource: parsedDS,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.components && Array.isArray(data.components)) {
          const newAdded = data.components.map((c: any, idx: number) => ({
            id: `c_ai_${Date.now()}_${idx}`,
            type: c.type || 'TextBox',
            name: c.name || `AiComp_${idx + 1}`,
            section: c.section || 'Detail',
            x: snap(c.x || 24),
            y: snap(c.y || 120 + idx * 45),
            width: c.width || 260,
            height: c.height || 50,
            value: c.value || 'AI Element',
            fontSize: c.style?.fontSize || 10,
            fontWeight: c.style?.fontWeight || 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            color: c.style?.color || '#0f172a',
            backgroundColor: 'transparent',
            category: c.category || 'Charts',
            dataConfig: c.dataConfig,
          }));

          setComponents([...components, ...newAdded]);
          setSelectedId(newAdded[0]?.id || '');
          setAiChatMessages((prev) => [
            ...prev,
            { role: 'user', text: aiPromptInput },
            {
              role: 'assistant',
              text: `Berhasil menambahkan ${newAdded.length} komponen ke canvas dengan auto-binding data source! ${
                data.explanation || ''
              }`,
            },
          ]);
          setAiPromptInput('');
        }
      }
    } catch (err: any) {
      alert('Error calling Gemini AI: ' + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiFormula = async () => {
    if (!formulaPrompt.trim()) return;
    setIsAiLoading(true);

    try {
      const res = await fetch('http://localhost:5488/api/v1/ai/formula-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: formulaPrompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedFormula(data.formula);
        if (selectedComp) {
          updateSelected('value', data.formula);
        }
      }
    } catch (err: any) {
      alert('Gemini Formula error: ' + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const selectedComp = components.find((c) => c.id === selectedId);

  const updateSelected = (field: keyof ComponentItem, val: any) => {
    setComponents((prev) => prev.map((c) => (c.id === selectedId ? { ...c, [field]: val } : c)));
  };

  const updateDataConfig = (field: keyof DataConfig, val: any) => {
    if (!selectedComp) return;
    const current = selectedComp.dataConfig || { mode: 'manual' };
    updateSelected('dataConfig', { ...current, [field]: val });
  };

  const snap = (val: number) => {
    if (!snapToGrid) return val;
    return Math.round(val / gridSize) * gridSize;
  };

  // Unclick Canvas: Clicking on background resets selectedId to ''
  const handleCanvasBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-unclick-surface')) {
      setSelectedId('');
      setEditingId(null);
    }
  };

  const handleMouseDownOnComp = (e: React.MouseEvent, comp: ComponentItem) => {
    if (editingId === comp.id) return;
    e.stopPropagation();
    setSelectedId(comp.id);

    setDragState({
      isDragging: true,
      isResizing: false,
      startX: e.clientX,
      startY: e.clientY,
      initialX: comp.x,
      initialY: comp.y,
      initialW: comp.width,
      initialH: comp.height,
    });
  };

  const handleMouseDownOnHandle = (e: React.MouseEvent, comp: ComponentItem, handle: 'se' | 'e' | 's') => {
    e.stopPropagation();
    setSelectedId(comp.id);
    setDragState({
      isDragging: false,
      isResizing: true,
      resizeHandle: handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: comp.x,
      initialY: comp.y,
      initialW: comp.width,
      initialH: comp.height,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedComp) return;
    const scaleFactor = zoom / 100;

    if (dragState.isDragging) {
      const deltaX = (e.clientX - dragState.startX) / scaleFactor;
      const deltaY = (e.clientY - dragState.startY) / scaleFactor;
      const newX = snap(Math.max(0, dragState.initialX + deltaX));
      const newY = snap(Math.max(0, dragState.initialY + deltaY));
      updateSelected('x', newX);
      updateSelected('y', newY);
    } else if (dragState.isResizing) {
      const deltaX = (e.clientX - dragState.startX) / scaleFactor;
      const deltaY = (e.clientY - dragState.startY) / scaleFactor;

      if (dragState.resizeHandle === 'se' || dragState.resizeHandle === 'e') {
        const newW = snap(Math.max(30, dragState.initialW + deltaX));
        updateSelected('width', newW);
      }
      if (dragState.resizeHandle === 'se' || dragState.resizeHandle === 's') {
        const newH = snap(Math.max(15, dragState.initialH + deltaY));
        updateSelected('height', newH);
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDragging || dragState.isResizing) {
      setDragState((prev) => ({ ...prev, isDragging: false, isResizing: false }));
    }
  };

  const handleAddFromCatalog = (item: CatalogItem) => {
    // Smart Placement: Find bottom-most edge of existing components to prevent accidental overlap
    let nextY = 120;
    if (components.length > 0) {
      // Look at components in the middle area (excluding fixed bottom footers)
      const detailComps = components.filter(c => c.y < 700);
      if (detailComps.length > 0) {
        const maxY = detailComps.reduce((max, c) => Math.max(max, c.y + c.height), 120);
        nextY = maxY + 16;
        if (nextY + item.defaultHeight > 700) {
          nextY = 120; // reset if page bottom reached
        }
      }
    }

    const newComp: ComponentItem = {
      id: `c_${Date.now()}`,
      type: item.type,
      name: `${item.type}_${components.length + 1}`,
      section: 'Detail',
      x: snap(24),
      y: snap(nextY),
      width: item.defaultWidth,
      height: item.defaultHeight,
      value: item.defaultValue || item.label,
      fontSize: 10,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      color: '#0f172a',
      backgroundColor: 'transparent',
      category: item.category,
      config: item.config,
      dataConfig: item.dataConfig,
      zIndex: components.length + 1,
    };
    setComponents([...components, newComp]);
    setSelectedId(newComp.id);
  };

  const handleDuplicate = () => {
    if (!selectedComp) return;
    const duplicated: ComponentItem = {
      ...selectedComp,
      id: `c_${Date.now()}`,
      name: `${selectedComp.name}_copy`,
      x: snap(selectedComp.x + 16),
      y: snap(selectedComp.y + 16),
    };
    setComponents([...components, duplicated]);
    setSelectedId(duplicated.id);
  };

  const handleDelete = () => {
    if (!selectedComp) return;
    setComponents((prev) => prev.filter((c) => c.id !== selectedId));
    setSelectedId('');
    setEditingId(null);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filteredCatalog = COMPONENT_CATALOG.filter((c) => {
    const matchesSearch =
      c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  let activeDataSourceSample: any = null;
  try {
    activeDataSourceSample = JSON.parse(dataSourceJson);
  } catch {}

  const handlePaperSizeChange = (size: PageSettingsConfig['paperSize']) => {
    const isLand = pageSettings.orientation === 'landscape';
    let w = 210;
    let h = 297;

    switch (size) {
      case 'A3': w = isLand ? 420 : 297; h = isLand ? 297 : 420; break;
      case 'A4': w = isLand ? 297 : 210; h = isLand ? 210 : 297; break;
      case 'A5': w = isLand ? 210 : 148; h = isLand ? 148 : 210; break;
      case 'Letter': w = isLand ? 279 : 216; h = isLand ? 216 : 279; break;
      case 'Legal': w = isLand ? 356 : 216; h = isLand ? 216 : 356; break;
      case 'Custom': w = pageSettings.width; h = pageSettings.height; break;
    }

    setPageSettings((prev) => ({ ...prev, paperSize: size, width: w, height: h }));
  };

  const handleOrientationToggle = (orient: 'portrait' | 'landscape') => {
    if (pageSettings.orientation === orient) return;
    const w = pageSettings.height;
    const h = pageSettings.width;
    setPageSettings((prev) => ({ ...prev, orientation: orient, width: w, height: h }));
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans select-none"
    >
      {/* 1. Header with Auto-save on Preview */}
      <DesignerHeader
        reportId={reportId}
        dbSource={dbSource}
        zoom={zoom}
        setZoom={setZoom}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        snapToGrid={snapToGrid}
        setSnapToGrid={setSnapToGrid}
        isAiDrawerOpen={isAiDrawerOpen}
        setIsAiDrawerOpen={setIsAiDrawerOpen}
        aiPromptInput={aiPromptInput}
        setAiPromptInput={setAiPromptInput}
        isAiLoading={isAiLoading}
        onAiGenerate={handleAiGenerate}
        onOpenDataSourceModal={() => setIsDataSourceModalOpen(true)}
        onSaveToDatabase={handleSaveToDatabase}
        isSaving={isSaving}
        saveStatus={saveStatus}
      />

      {/* 2. Main Studio Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbox Panel: Clean 7 Categories */}
        <ToolboxPanel
          categories={CATEGORIES}
          filteredCatalog={filteredCatalog}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          expandedCategories={expandedCategories}
          onToggleCategory={toggleCategory}
          onAddFromCatalog={handleAddFromCatalog}
        />

        {/* Center Canvas with Unclick Handler */}
        <ReportCanvas
          canvasRef={canvasRef}
          pageSettings={pageSettings}
          components={components}
          selectedId={selectedId}
          editingId={editingId}
          zoom={zoom}
          showGrid={showGrid}
          gridSize={gridSize}
          activeDataSourceSample={activeDataSourceSample}
          onCanvasBackgroundMouseDown={handleCanvasBackgroundMouseDown}
          onMouseDownOnComp={handleMouseDownOnComp}
          onMouseDownOnHandle={handleMouseDownOnHandle}
          onComponentDoubleClick={(comp) => setEditingId(comp.id)}
          onUpdateSelectedValue={(val) => updateSelected('value', val)}
          onFinishInlineEdit={() => setEditingId(null)}
        />

        {/* Right Properties Panel: Page Settings, Component, DataConfig, AI */}
        <PropertiesPanel
          selectedComp={selectedComp || null}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pageSettings={pageSettings}
          onPaperSizeChange={handlePaperSizeChange}
          onOrientationToggle={handleOrientationToggle}
          onUpdatePageSettings={setPageSettings}
          allFields={allSchemaFields}
          dataSourceName={dataSourceName}
          onUpdateSelected={updateSelected}
          onUpdateDataConfig={updateDataConfig}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          formulaPrompt={formulaPrompt}
          setFormulaPrompt={setFormulaPrompt}
          isAiLoading={isAiLoading}
          onAiFormula={handleAiFormula}
          generatedFormula={generatedFormula}
          aiPromptInput={aiPromptInput}
          setAiPromptInput={setAiPromptInput}
          onAiGenerate={handleAiGenerate}
        />
      </div>

      {/* 3. Slide-out Gemini AI Assistant Drawer */}
      <AiStudioDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        messages={aiChatMessages}
        promptInput={aiPromptInput}
        setPromptInput={setAiPromptInput}
        isLoading={isAiLoading}
        onSendMessage={async (e) => {
          e.preventDefault();
          if (!aiPromptInput.trim()) return;
          const userText = aiPromptInput;
          setAiPromptInput('');
          setAiChatMessages((prev) => [...prev, { role: 'user', text: userText }]);
          setIsAiLoading(true);

          try {
            const res = await fetch('http://localhost:5488/api/v1/ai/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: userText }),
            });
            if (res.ok) {
              const data = await res.json();
              setAiChatMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
            }
          } catch (err: any) {
            setAiChatMessages((prev) => [...prev, { role: 'assistant', text: 'Error: ' + err.message }]);
          } finally {
            setIsAiLoading(false);
          }
        }}
      />

      {/* 4. Modal Dialog: Data Source Configuration */}
      <DataSourceModal
        isOpen={isDataSourceModalOpen}
        onClose={() => setIsDataSourceModalOpen(false)}
        dataSourceName={dataSourceName}
        setDataSourceName={setDataSourceName}
        dataProviderType={dataProviderType}
        setDataProviderType={setDataProviderType}
        dataSourceJson={dataSourceJson}
        setDataSourceJson={setDataSourceJson}
        restApiUrl={restApiUrl}
        setRestApiUrl={setRestApiUrl}
        isSaving={isSavingDataSource}
        successMessage={dataSourceSuccess}
        onSubmit={handleSaveDataSourceDialog}
      />
    </div>
  );
}
