import { describe, it, expect } from 'vitest';
import { executeReport } from './index';
import { ReportDefinition } from '@rsc/report-schema';

describe('Reporting Pipeline', () => {
  it('executes simple invoice report and produces document model', () => {
    const reportDef: ReportDefinition = {
      schemaVersion: '1.0.0',
      reportId: 'invoice-sample',
      name: 'Invoice Sample',
      pageSettings: {
        paperSize: 'A4',
        orientation: 'portrait',
        margins: { top: 10, bottom: 10, left: 10, right: 10, unit: 'mm' },
      },
      parameters: [],
      dataSources: [],
      datasets: [
        {
          id: 'itemsDs',
          name: 'Items',
          dataPath: 'items',
          filters: [],
          sorting: [],
          calculatedFields: {},
        },
      ],
      sections: [
        {
          id: 'sec-hdr',
          name: 'ReportHeader',
          type: 'ReportHeader',
          height: 30,
          visible: true,
          canGrow: false,
          keepTogether: false,
          components: [
            {
              id: 'txt-title',
              name: 'Title',
              type: 'TextBox',
              x: 0,
              y: 5,
              width: 190,
              height: 15,
              value: 'INVOICE =Fields.invoiceNumber',
              canGrow: true,
              canShrink: false,
              zIndex: 0,
              visible: true,
              style: {
                fontSize: 16,
                fontWeight: 'bold',
                fontFamily: 'Inter',
                color: '#111827',
                textAlign: 'left',
                verticalAlign: 'top',
                padding: { top: 0, bottom: 0, left: 0, right: 0 },
              },
            },
          ],
        },
        {
          id: 'sec-detail',
          name: 'Detail',
          type: 'Detail',
          height: 50,
          visible: true,
          canGrow: true,
          keepTogether: false,
          components: [
            {
              id: 'tbl-items',
              name: 'ItemsTable',
              type: 'Table',
              x: 0,
              y: 5,
              width: 190,
              height: 40,
              zIndex: 0,
              visible: true,
              style: {
                fontSize: 10,
                fontWeight: 'normal',
                fontFamily: 'Inter',
                color: '#374151',
                textAlign: 'left',
                verticalAlign: 'middle',
                padding: { top: 0, bottom: 0, left: 0, right: 0 },
              },
              columns: [
                { id: 'c1', title: 'Product', width: 100, field: 'name' },
                { id: 'c2', title: 'Qty', width: 30, field: 'quantity' },
                { id: 'c3', title: 'Price', width: 60, field: 'price', footerExpression: '=Sum(Fields.price)' },
              ],
              showHeader: true,
              showFooter: true,
              rowHeight: 8,
              headerHeight: 10,
              footerHeight: 10,
              repeatHeaderOnEveryPage: true,
            },
          ],
        },
      ],
    };

    const doc = executeReport(reportDef, {
      data: {
        invoiceNumber: 'INV-2026-001',
        items: [
          { name: 'Ergonomic Keyboard', quantity: 1, price: 1500000 },
          { name: 'Wireless Mouse', quantity: 2, price: 500000 },
        ],
      },
    });

    expect(doc.pages.length).toBe(1);
    expect(doc.metadata.totalRows).toBe(2);
    const tblElem = doc.pages[0].elements.find(e => e.type === 'table');
    expect(tblElem).toBeDefined();
    expect(tblElem?.tableData?.rows.length).toBe(2);
    expect(tblElem?.tableData?.headers).toEqual(['Product', 'Qty', 'Price']);
  });
});
