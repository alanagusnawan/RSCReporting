import { ReportDefinition } from '@rsc/report-schema';

export const InvoiceTemplateDefinition: ReportDefinition = {
  schemaVersion: '1.0.0',
  reportId: 'invoice-v1',
  name: 'Standard Commercial Invoice',
  description: 'Production invoice template with line items, tax calculation, and payment details',
  pageSettings: {
    paperSize: 'A4',
    orientation: 'portrait',
    margins: { top: 15, bottom: 15, left: 15, right: 15, unit: 'mm' },
  },
  parameters: [],
  dataSources: [],
  datasets: [{ id: 'itemsDs', name: 'Items', dataPath: 'items', filters: [], sorting: [], calculatedFields: {} }],
  sections: [],
};

export const ReceiptTemplateDefinition: ReportDefinition = {
  ...InvoiceTemplateDefinition,
  reportId: 'receipt-v1',
  name: 'Payment Receipt',
  description: 'Point-of-sale customer receipt',
};

export const DeliveryNoteTemplateDefinition: ReportDefinition = {
  ...InvoiceTemplateDefinition,
  reportId: 'delivery-note-v1',
  name: 'Delivery Note',
  description: 'Logistics delivery dispatch note',
};

export const PurchaseOrderTemplateDefinition: ReportDefinition = {
  ...InvoiceTemplateDefinition,
  reportId: 'purchase-order-v1',
  name: 'Purchase Order',
  description: 'Official corporate purchase order',
};

export const GeneralReportTemplateDefinition: ReportDefinition = {
  ...InvoiceTemplateDefinition,
  reportId: 'general-report-v1',
  name: 'General Data Report',
  description: 'General data reporting template with aggregation and totals',
};
