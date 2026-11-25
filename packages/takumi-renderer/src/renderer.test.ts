import { describe, it, expect } from 'vitest';
import { executeReport } from '@rsc/reporting-engine';
import {
  TakumiRenderer,
  InvoiceTemplateDefinition,
  ReceiptTemplateDefinition,
  DeliveryNoteTemplateDefinition,
  PurchaseOrderTemplateDefinition,
  GeneralReportTemplateDefinition
} from './index';

describe('Takumi PDF Renderer & Production Templates', () => {
  const sampleData = {
    invoiceNumber: 'INV-2026-999',
    date: '2026-10-29',
    customer: { name: 'Acme Corp', address: 'Jakarta, Indonesia' },
    items: [
      { name: 'Enterprise Cloud Server', quantity: 2, price: 15000000 },
      { name: 'SSL Certificate Wildcard', quantity: 1, price: 2500000 },
    ],
  };

  it('renders Invoice template to valid PDF buffer with %PDF- header', async () => {
    const doc = executeReport(InvoiceTemplateDefinition, { data: sampleData });
    const pdfBytes = await TakumiRenderer.renderToPdf(doc);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(100);

    const header = Buffer.from(pdfBytes.slice(0, 5)).toString();
    expect(header).toBe('%PDF-');
  });

  it('renders all 5 pre-seeded production templates', async () => {
    const templates = [
      InvoiceTemplateDefinition,
      ReceiptTemplateDefinition,
      DeliveryNoteTemplateDefinition,
      PurchaseOrderTemplateDefinition,
      GeneralReportTemplateDefinition,
    ];

    for (const tmpl of templates) {
      const doc = executeReport(tmpl, { data: sampleData });
      const pdfBytes = await TakumiRenderer.renderToPdf(doc);
      expect(pdfBytes.length).toBeGreaterThan(100);
      expect(Buffer.from(pdfBytes.slice(0, 5)).toString()).toBe('%PDF-');
    }
  });
});
