import { ReportDefinition, Section, Component, TableComponent, TextBoxComponent } from '@rsc/report-schema';
import { evaluateExpression, EvaluationContext } from '@rsc/expression-engine';
import { DocumentModel, DocumentPage, RenderedElement } from './document-model';
import { DataProcessor } from './data-processor';

export interface ExecutionOptions {
  data: any;
  parameters?: Record<string, any>;
  locale?: string;
}

export class ExecutionPipeline {
  private def: ReportDefinition;
  private options: ExecutionOptions;

  constructor(definition: ReportDefinition, options: ExecutionOptions) {
    this.def = definition;
    this.options = options;
  }

  execute(): DocumentModel {
    const rawData = this.options.data || {};
    const dataset = this.def.datasets?.[0];
    const rows = DataProcessor.applyFiltersAndSorting(
      DataProcessor.extractRows(rawData, dataset?.dataPath),
      dataset
    );

    const isLandscape = this.def.pageSettings?.orientation === 'landscape';
    const pageWidth = this.def.pageSettings?.width || (isLandscape ? 297 : 210);
    const pageHeight = this.def.pageSettings?.height || (isLandscape ? 210 : 297);
    const margins = this.def.pageSettings?.margins || { top: 10, bottom: 10, left: 10, right: 10 };

    const printableWidth = pageWidth - (margins.left + margins.right);
    const printableHeight = pageHeight - (margins.top + margins.bottom);

    const pages: DocumentPage[] = [];
    let currentPageNumber = 1;

    // Collect all components across all sections preserving relative order
    const allSections = this.def.sections || [];
    const flattenedComponents: any[] = [];

    for (const sec of allSections) {
      if (!sec.components) continue;
      for (const comp of sec.components) {
        flattenedComponents.push(comp);
      }
    }

    // Sort components primarily by Y coordinate
    flattenedComponents.sort((a, b) => a.y - b.y);

    let elementsOnCurrentPage: RenderedElement[] = [];

    // Track dynamic height pushes from expanding tables/grids
    // Any table that expands pushes down all subsequent components positioned below it
    const pushDeltas: Array<{ triggerBottomY: number; deltaY: number }> = [];

    for (const comp of flattenedComponents) {
      // Calculate effective Y coordinate based on prior dynamic table expansions
      let effectiveY = comp.y;
      if (!comp.allowOverlap) {
        for (const push of pushDeltas) {
          if (comp.y >= push.triggerBottomY) {
            effectiveY += push.deltaY;
          }
        }
      }

      if (comp.type === 'Table' || comp.type === 'DataGrid' || comp.type === 'Spreadsheet') {
        const tbl = comp as any;
        const dataConfig = tbl.dataConfig;
        const rawColumns = dataConfig?.columns || tbl.columns || [
          { id: 'c1', title: 'Product Name', field: 'name', width: 220, visible: true },
          { id: 'c2', title: 'Qty', field: 'quantity', width: 60, visible: true },
          { id: 'c3', title: 'Price', field: 'price', width: 120, visible: true },
          { id: 'c4', title: 'Subtotal', field: 'price', width: 140, visible: true },
        ];

        const activeColumns = rawColumns.filter((c: any) => c.visible !== false);
        const headers = activeColumns.map((c: any) => c.title);
        const colWidths = activeColumns.map((c: any) => c.width || 100);

        const tablePath = dataConfig?.dataPath || dataset?.dataPath || 'items';
        const tableRowsData = DataProcessor.extractRows(rawData, tablePath);
        const effectiveRows = tableRowsData.length > 0 ? tableRowsData : rows;

        const tableRows: string[][] = [];
        for (let i = 0; i < effectiveRows.length; i++) {
          const rowData = effectiveRows[i];
          const rowTexts = activeColumns.map((col: any) => {
            const fieldStr = col.field;
            if (fieldStr.startsWith('=') || fieldStr.includes('Fields.') || fieldStr.includes('*') || fieldStr.includes('+')) {
              const expr = fieldStr.startsWith('=') ? fieldStr : `=${fieldStr}`;
              return String(evaluateExpression(expr, {
                fields: rowData,
                parameters: this.options.parameters,
                rowNumber: i + 1,
              }) ?? '');
            }
            return String(rowData[fieldStr] ?? '');
          });
          tableRows.push(rowTexts);
        }

        let footers: string[] | undefined = undefined;
        const showFooter = dataConfig?.showSummary !== false && (tbl.showFooter !== false);

        if (showFooter) {
          footers = activeColumns.map((col: any) => {
            if (col.footerExpression) {
              let total = 0;
              for (const r of effectiveRows) {
                const fVal = evaluateExpression(col.field.startsWith('=') ? col.field : `=${col.field}`, { fields: r });
                if (typeof fVal === 'number') total += fVal;
              }
              const expr = col.footerExpression.replace(/Sum\([^)]+\)/i, String(total));
              return String(evaluateExpression(expr, { fields: { total } }) ?? total);
            }
            if (col.field === 'price' || col.field.includes('price')) {
              let total = 0;
              for (const r of effectiveRows) {
                const v = Number(r.price);
                if (!isNaN(v)) total += v;
              }
              return `Total: ${total.toLocaleString()}`;
            }
            return '';
          });
        }

        // Calculate actual expanded table height vs design height
        const rowHeight = tbl.rowHeight || 24;
        const headerHeight = tbl.headerHeight || 28;
        const footerHeight = showFooter ? 28 : 0;
        const actualTableHeight = (tableRows.length * rowHeight) + headerHeight + footerHeight;
        const designTableHeight = tbl.height || 160;

        // If actual table height is taller than canvas design placeholder, record push delta
        if (actualTableHeight > designTableHeight) {
          const deltaY = actualTableHeight - designTableHeight;
          pushDeltas.push({
            triggerBottomY: comp.y + 10, // any element at or below table Y gets pushed
            deltaY,
          });
        }

        elementsOnCurrentPage.push({
          id: tbl.id,
          type: tbl.type === 'Table' ? 'table' : tbl.type,
          x: tbl.x,
          y: effectiveY,
          width: tbl.width || printableWidth,
          height: actualTableHeight,
          style: tbl.style || {},
          tableData: {
            headers,
            rows: tableRows,
            columnWidths: colWidths,
            showFooter,
            footers,
          },
          dataConfig,
        });
      } else {
        const compWithEffectiveY = { ...comp, y: effectiveY };
        elementsOnCurrentPage.push(this.renderComponent(compWithEffectiveY, 0, rawData, currentPageNumber));
      }
    }

    // Separate PageHeader, PageFooter, and body components
    const headerElements: RenderedElement[] = [];
    const footerElements: RenderedElement[] = [];
    const bodyElements: RenderedElement[] = [];

    for (const elem of elementsOnCurrentPage) {
      const origComp = flattenedComponents.find((c) => c.id === elem.id);
      const secType = origComp?.section;
      if (secType === 'PageHeader') {
        headerElements.push(elem);
      } else if (secType === 'PageFooter') {
        footerElements.push(elem);
      } else {
        bodyElements.push(elem);
      }
    }

    pages.push({
      pageNumber: 1,
      totalPages: 1,
      width: pageWidth,
      height: pageHeight,
      margins,
      elements: elementsOnCurrentPage,
    });

    return {
      title: this.def.name,
      pageSettings: {
        paperSize: this.def.pageSettings?.paperSize || 'A4',
        orientation: isLandscape ? 'landscape' : 'portrait',
        width: pageWidth,
        height: pageHeight,
        margins,
        headerHeight: this.def.pageSettings?.headerHeight,
        footerHeight: this.def.pageSettings?.footerHeight,
        headerRepeatMode: this.def.pageSettings?.headerRepeatMode,
        headerBorderBottom: this.def.pageSettings?.headerBorderBottom,
        footerRepeatMode: this.def.pageSettings?.footerRepeatMode,
        footerBorderTop: this.def.pageSettings?.footerBorderTop,
        footerShowPageNumber: this.def.pageSettings?.footerShowPageNumber,
        footerPageNumberFormat: this.def.pageSettings?.footerPageNumberFormat,
        footerPageNumberAlign: this.def.pageSettings?.footerPageNumberAlign,
      },
      pages,
      headerElements,
      footerElements,
      metadata: {
        totalRows: rows.length,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private renderComponent(comp: Component, offsetY: number, globalData: any, pageNumber: number): RenderedElement {
    let content = '';
    const compAny = comp as any;
    const dataConfig = compAny.dataConfig;

    const ctx: EvaluationContext = {
      fields: globalData,
      parameters: this.options.parameters,
      globals: { PageNumber: pageNumber },
    };

    if (comp.type === 'TextBox' || comp.type === 'Label') {
      const val = compAny.value || compAny.text || '';
      if (typeof val === 'string' && (val.startsWith('=') || val.includes('Fields.') || val.includes('[0]'))) {
        const expr = val.startsWith('=') ? val : `=${val}`;
        try {
          content = String(evaluateExpression(expr, ctx) ?? val);
        } catch {
          content = val;
        }
      } else {
        content = val;
      }
    } else if (comp.type === 'PictureBox') {
      content = compAny.source || compAny.value || '';
    } else {
      content = String(compAny.value || '');
    }

    let chartData: { labels: string[]; values: number[] } | undefined = undefined;
    if (comp.type.includes('Chart') || comp.type === 'DonutChart' || comp.type === 'PieChart' || comp.type === 'Sparkline' || comp.type === 'Drilldown' || comp.type === 'Waterfall') {
      let labels = ['Q1', 'Q2', 'Q3', 'Q4'];
      let values = [120, 240, 180, 320];

      if (dataConfig?.mode === 'dataSource' && globalData) {
        const dataPath = dataConfig.dataPath || 'items';
        const rows = Array.isArray(globalData[dataPath]) ? globalData[dataPath] : Array.isArray(globalData) ? globalData : [];
        if (rows.length > 0) {
          const catKey = dataConfig.categoryField?.replace(/^(=Fields\.|\=)/, '') || 'name';
          const valKey = dataConfig.valueField?.replace(/^(=Fields\.|\=)/, '') || 'price';

          labels = rows.map((r: any) => String(r[catKey] ?? 'Item'));
          values = rows.map((r: any) => {
            const v = Number(r[valKey]);
            return isNaN(v) ? 10 : v;
          });
        }
      } else if (dataConfig?.mode === 'manual' && dataConfig.staticLabels && dataConfig.staticValues) {
        labels = dataConfig.staticLabels;
        values = dataConfig.staticValues;
      }

      chartData = { labels, values };
    }

    let gaugeData: { current: number; min: number; max: number; unit: string } | undefined = undefined;
    if (comp.type.includes('Gauge')) {
      let current = dataConfig?.target ?? 80;
      const min = dataConfig?.min ?? 0;
      const max = dataConfig?.max ?? 100;
      const unit = dataConfig?.unit || '%';

      if (dataConfig?.mode === 'dataSource' && dataConfig.valueExpression) {
        try {
          const expr = dataConfig.valueExpression.startsWith('=') ? dataConfig.valueExpression : `=${dataConfig.valueExpression}`;
          const ev = evaluateExpression(expr, ctx);
          if (typeof ev === 'number') current = ev;
        } catch {}
      }

      gaugeData = { current, min, max, unit };
    }

    return {
      id: comp.id,
      type: comp.type,
      x: comp.x,
      y: comp.y + offsetY,
      width: comp.width,
      height: comp.height,
      style: comp.style || {},
      content,
      chartData,
      gaugeData,
      dataConfig,
    };
  }
}

export function executeReport(definition: ReportDefinition, options: ExecutionOptions): DocumentModel {
  const pipeline = new ExecutionPipeline(definition, options);
  return pipeline.execute();
}
