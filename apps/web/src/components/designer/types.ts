export interface TableColumnConfig {
  id: string;
  title: string;
  field: string;
  width: number; // in pixels
  visible?: boolean;
  totalExpression?: string;
  format?: string;
}

export interface DataConfig {
  mode: 'manual' | 'dataSource';
  dataPath?: string; // e.g. "items"
  categoryField?: string; // e.g. "name" or "=Fields.items.[0].name"
  valueField?: string; // e.g. "price" or "=Fields.items.[0].price"
  staticLabels?: string[];
  staticValues?: number[];
  // Gauges
  min?: number;
  max?: number;
  target?: number;
  unit?: string;
  valueExpression?: string;
  // Tables / DataGrid custom configuration
  columns?: TableColumnConfig[];
  showSummary?: boolean; // toggle whether bottom total / summary row is shown
  summaryExpression?: string; // e.g. "=Sum(Fields.price)"
  rowHeight?: number;
  headerHeight?: number;
  fontSize?: number;
}

export interface ComponentItem {
  id: string;
  type: string;
  name: string;
  section: 'PageHeader' | 'ReportHeader' | 'Detail' | 'PageFooter';
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  backgroundColor: string;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  category?: string;
  config?: Record<string, any>;
  dataConfig?: DataConfig;
  zIndex?: number;
  allowOverlap?: boolean;
}

export interface PageSettingsConfig {
  paperSize: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Custom';
  orientation: 'portrait' | 'landscape';
  width: number; // in mm
  height: number; // in mm
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    unit: 'mm';
  };
  headerHeight?: number; // in mm
  footerHeight?: number; // in mm
  headerRepeatMode?: 'all' | 'skipFirst' | 'odd' | 'even';
  headerBorderBottom?: boolean;
  footerRepeatMode?: 'all' | 'skipLast' | 'odd' | 'even';
  footerBorderTop?: boolean;
  footerShowPageNumber?: boolean;
  footerPageNumberFormat?: 'pageOfTotal' | 'pageOnly' | 'dashPage';
  footerPageNumberAlign?: 'left' | 'center' | 'right';
  showHeaderOnFirstPage?: boolean;
  showFooterOnLastPage?: boolean;
  backgroundColor?: string;
}
