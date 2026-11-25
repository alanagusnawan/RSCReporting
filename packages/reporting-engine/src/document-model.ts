import { Style } from '@rsc/report-schema';

export interface RenderedElement {
  id: string;
  type: string; // 'text' | 'image' | 'line' | 'shape' | 'table' | 'BarChart' | 'PieChart' | 'CircularGauge' | etc.
  x: number;
  y: number;
  width: number;
  height: number;
  style: Style;
  content?: string;
  tableData?: {
    headers: string[];
    rows: string[][];
    columnWidths: number[];
    showFooter?: boolean;
    footers?: string[];
  };
  chartData?: {
    labels: string[];
    values: number[];
  };
  gaugeData?: {
    current: number;
    min: number;
    max: number;
    unit: string;
  };
  dataConfig?: any;
}

export interface DocumentPage {
  pageNumber: number;
  totalPages: number;
  width: number; // in mm
  height: number; // in mm
  margins: { top: number; bottom: number; left: number; right: number };
  elements: RenderedElement[];
}

export interface DocumentModel {
  title: string;
  pageSettings: {
    paperSize: string;
    orientation: 'portrait' | 'landscape';
    width: number;
    height: number;
    margins: { top: number; bottom: number; left: number; right: number };
    headerHeight?: number;
    footerHeight?: number;
    headerRepeatMode?: 'all' | 'skipFirst' | 'odd' | 'even';
    headerBorderBottom?: boolean;
    footerRepeatMode?: 'all' | 'skipLast' | 'odd' | 'even';
    footerBorderTop?: boolean;
    footerShowPageNumber?: boolean;
    footerPageNumberFormat?: 'pageOfTotal' | 'pageOnly' | 'dashPage';
    footerPageNumberAlign?: 'left' | 'center' | 'right';
  };
  pages: DocumentPage[];
  headerElements?: RenderedElement[];
  footerElements?: RenderedElement[];
  metadata: {
    totalRows: number;
    generatedAt: string;
  };
}
