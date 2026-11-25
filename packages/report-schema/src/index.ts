import { z } from 'zod';

export const PaperSizeSchema = z.enum(['A4', 'A3', 'A5', 'Letter', 'Legal', 'Custom']);
export type PaperSize = z.infer<typeof PaperSizeSchema>;

export const OrientationSchema = z.enum(['portrait', 'landscape']);
export type Orientation = z.infer<typeof OrientationSchema>;

export const UnitSchema = z.enum(['mm', 'cm', 'in', 'pt', 'px']);
export type Unit = z.infer<typeof UnitSchema>;

export const MarginsSchema = z.object({
  top: z.number().default(10),
  bottom: z.number().default(10),
  left: z.number().default(10),
  right: z.number().default(10),
  unit: UnitSchema.default('mm'),
});
export type Margins = z.infer<typeof MarginsSchema>;

export const PageSettingsSchema = z.object({
  paperSize: PaperSizeSchema.default('A4'),
  orientation: OrientationSchema.default('portrait'),
  width: z.number().optional(), // For custom size in mm
  height: z.number().optional(),
  margins: MarginsSchema.default({ top: 10, bottom: 10, left: 10, right: 10, unit: 'mm' }),
  headerHeight: z.number().default(20).optional(), // in mm
  footerHeight: z.number().default(15).optional(), // in mm
  headerRepeatMode: z.enum(['all', 'skipFirst', 'odd', 'even']).default('all').optional(),
  headerBorderBottom: z.boolean().default(true).optional(),
  footerRepeatMode: z.enum(['all', 'skipLast', 'odd', 'even']).default('all').optional(),
  footerBorderTop: z.boolean().default(true).optional(),
  footerShowPageNumber: z.boolean().default(true).optional(),
  footerPageNumberFormat: z.enum(['pageOfTotal', 'pageOnly', 'dashPage']).default('pageOfTotal').optional(),
  footerPageNumberAlign: z.enum(['left', 'center', 'right']).default('right').optional(),
  showHeaderOnFirstPage: z.boolean().default(true).optional(),
  showFooterOnLastPage: z.boolean().default(true).optional(),
});
export type PageSettings = z.infer<typeof PageSettingsSchema>;

export const StyleSchema = z.object({
  fontFamily: z.string().default('Inter, system-ui, sans-serif').optional(),
  fontSize: z.number().default(10).optional(),
  fontWeight: z.enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']).default('normal').optional(),
  fontStyle: z.enum(['normal', 'italic']).default('normal').optional(),
  color: z.string().default('#000000').optional(),
  backgroundColor: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).default('left').optional(),
  verticalAlign: z.enum(['top', 'middle', 'bottom']).default('top').optional(),
  padding: z.object({
    top: z.number().default(0),
    bottom: z.number().default(0),
    left: z.number().default(0),
    right: z.number().default(0),
  }).default({ top: 0, bottom: 0, left: 0, right: 0 }).optional(),
  border: z.object({
    top: z.string().optional(),
    bottom: z.string().optional(),
    left: z.string().optional(),
    right: z.string().optional(),
    color: z.string().default('#e5e7eb'),
    width: z.number().default(1),
    style: z.enum(['solid', 'dashed', 'dotted', 'none']).default('solid'),
  }).optional(),
  lineHeight: z.number().optional(),
});
export type Style = z.infer<typeof StyleSchema>;

export const BaseComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number().default(0),
  y: z.number().default(0),
  width: z.number().default(100),
  height: z.number().default(20),
  style: StyleSchema.default({}),
  visible: z.union([z.boolean(), z.string()]).default(true),
  zIndex: z.number().default(0),
  category: z.string().optional(),
});

// Generic Component Schema allowing full suite of 100+ components
export const GenericComponentSchema = BaseComponentSchema.extend({
  type: z.string(),
  value: z.any().optional(),
  format: z.string().optional(),
  canGrow: z.boolean().default(true).optional(),
  canShrink: z.boolean().default(false).optional(),
  config: z.record(z.any()).optional(),
  columns: z.array(z.any()).optional(),
  showHeader: z.boolean().optional(),
  showFooter: z.boolean().optional(),
  rowHeight: z.number().optional(),
  headerHeight: z.number().optional(),
  footerHeight: z.number().optional(),
  repeatHeaderOnEveryPage: z.boolean().optional(),
  alternatingRowColor: z.string().optional(),
  source: z.string().optional(),
  text: z.string().optional(),
});
export type GenericComponent = z.infer<typeof GenericComponentSchema>;

export const ComponentSchema = GenericComponentSchema;
export type Component = z.infer<typeof ComponentSchema>;

// Explicit typed helpers for classic core components
export const TableColumnSchema = z.object({
  id: z.string(),
  title: z.string(),
  width: z.number().default(50),
  field: z.string(),
  format: z.string().optional(),
  style: StyleSchema.optional(),
  headerStyle: StyleSchema.optional(),
  footerExpression: z.string().optional(),
  footerStyle: StyleSchema.optional(),
});
export type TableColumn = z.infer<typeof TableColumnSchema>;

export type TextBoxComponent = GenericComponent;
export type TableComponent = GenericComponent;
export type LabelComponent = GenericComponent;
export type PictureBoxComponent = GenericComponent;
export type LineComponent = GenericComponent;
export type ShapeComponent = GenericComponent;
export type BarcodeComponent = GenericComponent;
export type SubReportComponent = GenericComponent;

export const SectionTypeSchema = z.enum([
  'ReportHeader',
  'PageHeader',
  'GroupHeader',
  'Detail',
  'GroupFooter',
  'PageFooter',
  'ReportFooter',
]);
export type SectionType = z.infer<typeof SectionTypeSchema>;

export const SectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: SectionTypeSchema,
  height: z.number().default(50),
  visible: z.union([z.boolean(), z.string()]).default(true),
  canGrow: z.boolean().default(true),
  keepTogether: z.boolean().default(false),
  components: z.array(ComponentSchema).default([]),
  groupExpression: z.string().optional(),
});
export type Section = z.infer<typeof SectionSchema>;

export const ParameterTypeSchema = z.enum(['string', 'integer', 'decimal', 'boolean', 'date', 'datetime']);
export type ParameterType = z.infer<typeof ParameterTypeSchema>;

export const ReportParameterSchema = z.object({
  name: z.string(),
  type: ParameterTypeSchema.default('string'),
  label: z.string().optional(),
  defaultValue: z.any().optional(),
  nullable: z.boolean().default(true),
  visible: z.boolean().default(true),
  options: z.array(z.object({ label: z.string(), value: z.any() })).optional(),
});
export type ReportParameter = z.infer<typeof ReportParameterSchema>;

export const DataSourceTypeSchema = z.enum(['inline', 'jsonFile', 'restApi', 'minioDataset']);
export type DataSourceType = z.infer<typeof DataSourceTypeSchema>;

export const DataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: DataSourceTypeSchema,
  config: z.record(z.any()).default({}),
});
export type DataSource = z.infer<typeof DataSourceSchema>;

export const DatasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  dataSourceId: z.string().optional(),
  dataPath: z.string().optional(),
  inlineData: z.any().optional(),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(['=', '<>', '>', '<', '>=', '<=', 'Like', 'In']),
    value: z.any(),
  })).default([]),
  sorting: z.array(z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']).default('asc'),
  })).default([]),
  calculatedFields: z.record(z.string()).default({}),
});
export type Dataset = z.infer<typeof DatasetSchema>;

export const ReportDefinitionSchema = z.object({
  schemaVersion: z.literal('1.0.0').default('1.0.0'),
  reportId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  pageSettings: PageSettingsSchema.default({}),
  parameters: z.array(ReportParameterSchema).default([]),
  dataSources: z.array(DataSourceSchema).default([]),
  datasets: z.array(DatasetSchema).default([]),
  sections: z.array(SectionSchema).default([]),
});
export type ReportDefinition = z.infer<typeof ReportDefinitionSchema>;

export function validateReportDefinition(data: unknown): { success: true; data: ReportDefinition } | { success: false; errors: z.ZodError } {
  const result = ReportDefinitionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
