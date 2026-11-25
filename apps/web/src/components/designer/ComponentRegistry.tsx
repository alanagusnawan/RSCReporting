import React from 'react';
import {
  Grid,
  Filter,
  FileSpreadsheet,
  PieChart,
  BarChart,
  LineChart,
  TrendingUp,
  BarChart2,
  ScatterChart,
  Target,
  Gauge,
  Activity,
  Type,
  FileText,
  FormInput,
  CheckSquare,
  Radio,
  ToggleLeft,
  Sliders,
  Calendar,
  Clock,
  Square,
  Minus,
  Layers,
  Barcode,
  QrCode,
  Image as ImageIcon,
  Compass,
  Sparkles
} from 'lucide-react';
import { DataConfig } from './types';

export interface CatalogItem {
  type: string;
  label: string;
  category: string;
  icon: any;
  desc: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultValue?: string;
  defaultStyle?: Record<string, any>;
  config?: Record<string, any>;
  dataConfig?: DataConfig;
}

export const COMPONENT_CATALOG: CatalogItem[] = [
  // 1. Data Grid & Tables
  {
    type: 'DataGrid',
    label: 'Data Grid (Table)',
    category: 'Data Grid & Tables',
    icon: Grid,
    desc: 'Customizable columns, widths & totals',
    defaultWidth: 540,
    defaultHeight: 200,
    defaultValue: 'Data Grid',
    dataConfig: {
      mode: 'dataSource',
      dataPath: 'items',
      showSummary: true,
      summaryExpression: '=Sum(Fields.price)',
      columns: [
        { id: 'c1', title: 'Product Name', field: 'name', width: 220, visible: true },
        { id: 'c2', title: 'Qty', field: 'quantity', width: 60, visible: true },
        { id: 'c3', title: 'Price', field: 'price', width: 120, visible: true },
        { id: 'c4', title: 'Subtotal', field: 'price', width: 140, visible: true },
      ],
    },
  },
  {
    type: 'Spreadsheet',
    label: 'Spreadsheet Grid',
    category: 'Data Grid & Tables',
    icon: FileSpreadsheet,
    desc: 'Excel-like tabular grid',
    defaultWidth: 540,
    defaultHeight: 200,
    defaultValue: 'A1: Products | B1: Revenue',
    dataConfig: { mode: 'dataSource', dataPath: 'items', showSummary: false },
  },
  {
    type: 'PivotGrid',
    label: 'PivotGrid',
    category: 'Data Grid & Tables',
    icon: Grid,
    desc: 'Multi-dimensional pivot table',
    defaultWidth: 520,
    defaultHeight: 180,
    defaultValue: 'Pivot Table Matrix',
  },
  {
    type: 'Filter',
    label: 'Data Filter Panel',
    category: 'Data Grid & Tables',
    icon: Filter,
    desc: 'Multi-criteria filter strip',
    defaultWidth: 320,
    defaultHeight: 60,
    defaultValue: 'Filter: Category In [Items]',
  },

  // 2. Charts (Visual Data Analytics)
  {
    type: 'BarChart',
    label: 'Bar Chart',
    category: 'Charts',
    icon: BarChart,
    desc: 'Bar visual comparison',
    defaultWidth: 360,
    defaultHeight: 180,
    defaultValue: 'Sales Distribution',
    dataConfig: {
      mode: 'dataSource',
      dataPath: 'items',
      categoryField: 'name',
      valueField: 'price',
      staticLabels: ['Takumi Engine', 'Template Eng', 'MinIO'],
      staticValues: [5000000, 1500000, 2000000],
    },
  },
  {
    type: 'PieChart',
    label: 'Pie Chart',
    category: 'Charts',
    icon: PieChart,
    desc: 'Circular whole proportions',
    defaultWidth: 260,
    defaultHeight: 200,
    defaultValue: 'Proportion Breakdown',
    dataConfig: {
      mode: 'dataSource',
      dataPath: 'items',
      categoryField: 'name',
      valueField: 'price',
      staticLabels: ['Hardware', 'Services', 'Cloud'],
      staticValues: [50, 30, 20],
    },
  },
  {
    type: 'DonutChart',
    label: 'Donut Chart',
    category: 'Charts',
    icon: PieChart,
    desc: 'Hollow pie percentage',
    defaultWidth: 260,
    defaultHeight: 200,
    defaultValue: 'Revenue Share',
    dataConfig: {
      mode: 'dataSource',
      dataPath: 'items',
      categoryField: 'name',
      valueField: 'quantity',
      staticLabels: ['Engine', 'Services', 'Storage'],
      staticValues: [40, 40, 20],
    },
  },
  {
    type: 'LineChart',
    label: 'Line Chart',
    category: 'Charts',
    icon: LineChart,
    desc: 'Time-series trend line',
    defaultWidth: 360,
    defaultHeight: 180,
    defaultValue: 'Monthly Trend',
    dataConfig: {
      mode: 'manual',
      staticLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      staticValues: [15, 28, 42, 38, 55, 70],
    },
  },
  {
    type: 'AreaChart',
    label: 'Area Chart',
    category: 'Charts',
    icon: TrendingUp,
    desc: 'Filled area volume trend',
    defaultWidth: 360,
    defaultHeight: 180,
    defaultValue: 'Area Volume',
    dataConfig: {
      mode: 'manual',
      staticLabels: ['Q1', 'Q2', 'Q3', 'Q4'],
      staticValues: [120, 240, 310, 450],
    },
  },
  { type: 'FunnelChart', label: 'Funnel Chart', category: 'Charts', icon: Target, desc: 'Sales pipeline stages', defaultWidth: 300, defaultHeight: 180, defaultValue: 'Leads -> Deals -> Won' },
  { type: 'Waterfall', label: 'Waterfall Chart', category: 'Charts', icon: BarChart, desc: 'Profit / loss cumulative bridge', defaultWidth: 380, defaultHeight: 180, defaultValue: 'Gross -> Tax -> Net' },
  { type: 'Sparkline', label: 'Sparkline', category: 'Charts', icon: TrendingUp, desc: 'Micro inline trend line', defaultWidth: 140, defaultHeight: 28, defaultValue: '∿∿∿ +18%' },

  // 3. Gauges & KPIs
  {
    type: 'CircularGauge',
    label: 'Circular Gauge',
    category: 'Gauges & KPIs',
    icon: Gauge,
    desc: '360° circular percentage dial',
    defaultWidth: 160,
    defaultHeight: 150,
    defaultValue: '85%',
    dataConfig: {
      mode: 'manual',
      min: 0,
      max: 100,
      target: 85,
      unit: '%',
      valueExpression: '=Avg(Fields.items.[0].price)',
    },
  },
  {
    type: 'ArcGauge',
    label: 'ArcGauge',
    category: 'Gauges & KPIs',
    icon: Gauge,
    desc: 'Semi-circular progress arc',
    defaultWidth: 160,
    defaultHeight: 120,
    defaultValue: '72%',
    dataConfig: {
      mode: 'manual',
      min: 0,
      max: 100,
      target: 72,
      unit: '%',
    },
  },
  {
    type: 'LinearGauge',
    label: 'LinearGauge',
    category: 'Gauges & KPIs',
    icon: Activity,
    desc: 'Horizontal KPI thermometer',
    defaultWidth: 240,
    defaultHeight: 44,
    defaultValue: 'Target: 80/100',
    dataConfig: {
      mode: 'manual',
      min: 0,
      max: 100,
      target: 80,
      unit: 'pts',
    },
  },
  {
    type: 'RadialGauge',
    label: 'RadialGauge',
    category: 'Gauges & KPIs',
    icon: Target,
    desc: 'Speedometer dial with needle',
    defaultWidth: 160,
    defaultHeight: 160,
    defaultValue: '120 km/h',
    dataConfig: {
      mode: 'manual',
      min: 0,
      max: 200,
      target: 120,
      unit: 'km/h',
    },
  },

  // 4. Text & Headings
  { type: 'TextBox', label: 'TextBox', category: 'Text & Headings', icon: Type, desc: 'Dynamic text or formula', defaultWidth: 240, defaultHeight: 34, defaultValue: 'Sample Text' },
  { type: 'Label', label: 'Static Label', category: 'Text & Headings', icon: Type, desc: 'Fixed section or column header', defaultWidth: 180, defaultHeight: 26, defaultValue: 'Header Label' },
  { type: 'TextArea', label: 'TextArea Block', category: 'Text & Headings', icon: FileText, desc: 'Multi-line terms or remarks', defaultWidth: 320, defaultHeight: 70, defaultValue: 'Terms and Conditions' },
  { type: 'FloatingLabel', label: 'Floating Label', category: 'Text & Headings', icon: Type, desc: 'Form field with floating title', defaultWidth: 200, defaultHeight: 38, defaultValue: 'Customer NPWP' },

  // 5. Inputs & Form Controls
  { type: 'Input', label: 'Input Field', category: 'Inputs & Form Controls', icon: FormInput, desc: 'Standard single-line text', defaultWidth: 200, defaultHeight: 34, defaultValue: 'Input' },
  { type: 'NumericTextBox', label: 'NumericTextBox', category: 'Inputs & Form Controls', icon: FormInput, desc: 'Formatted numeric box', defaultWidth: 160, defaultHeight: 34, defaultValue: '150,000' },
  { type: 'DatePicker', label: 'DatePicker', category: 'Inputs & Form Controls', icon: Calendar, desc: 'Date selection trigger', defaultWidth: 180, defaultHeight: 34, defaultValue: '2026-10-29' },
  { type: 'Checkbox', label: 'Checkbox', category: 'Inputs & Form Controls', icon: CheckSquare, desc: 'Tick check control', defaultWidth: 140, defaultHeight: 24, defaultValue: '☑ Confirmed' },
  { type: 'RadioButton', label: 'RadioButton', category: 'Inputs & Form Controls', icon: Radio, desc: 'Radio option circle', defaultWidth: 140, defaultHeight: 24, defaultValue: '◉ Option A' },
  { type: 'Switch', label: 'Switch Toggle', category: 'Inputs & Form Controls', icon: ToggleLeft, desc: 'Toggle switch slider', defaultWidth: 80, defaultHeight: 28, defaultValue: 'ON' },
  { type: 'Slider', label: 'Slider', category: 'Inputs & Form Controls', icon: Sliders, desc: 'Range continuous bar', defaultWidth: 200, defaultHeight: 30, defaultValue: '75%' },

  // 6. Layout & Shapes
  { type: 'Card', label: 'Card Container', category: 'Layout & Shapes', icon: Square, desc: 'Surface card with border', defaultWidth: 280, defaultHeight: 140, defaultValue: 'Card' },
  { type: 'Shape', label: 'Rectangle / Box', category: 'Layout & Shapes', icon: Square, desc: 'Bordered container box', defaultWidth: 200, defaultHeight: 60, defaultValue: '' },
  { type: 'Line', label: 'Divider Line', category: 'Layout & Shapes', icon: Minus, desc: 'Horizontal / vertical line', defaultWidth: 540, defaultHeight: 2, defaultValue: '' },
  { type: 'PageBreak', label: 'Page Break', category: 'Layout & Shapes', icon: Layers, desc: 'Forces new page creation', defaultWidth: 540, defaultHeight: 16, defaultValue: 'PAGE BREAK' },

  // 7. Barcodes & Media
  { type: 'Barcode', label: 'Barcode (1D)', category: 'Barcodes & Media', icon: Barcode, desc: 'Code128 / EAN13 barcode', defaultWidth: 180, defaultHeight: 50, defaultValue: 'INV-2026-900' },
  { type: 'QrCode', label: 'QR Code (2D)', category: 'Barcodes & Media', icon: QrCode, desc: '2D matrix scannable code', defaultWidth: 90, defaultHeight: 90, defaultValue: 'https://invoice.example.com/INV-900' },
  { type: 'PictureBox', label: 'PictureBox (Logo)', category: 'Barcodes & Media', icon: ImageIcon, desc: 'Image logo or product image', defaultWidth: 150, defaultHeight: 60, defaultValue: 'https://via.placeholder.com/150' },
  { type: 'Map', label: 'Geo Map Widget', category: 'Barcodes & Media', icon: Compass, desc: 'Location coordinates map', defaultWidth: 320, defaultHeight: 160, defaultValue: 'Jakarta (-6.2, 106.8)' },
];

export const CATEGORIES = Array.from(new Set(COMPONENT_CATALOG.map(c => c.category)));
