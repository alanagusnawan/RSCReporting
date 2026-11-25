import { describe, it, expect } from 'vitest';
import { validateReportDefinition, ReportDefinition } from './index';

describe('ReportDefinition Schema', () => {
  it('validates a minimal valid report definition', () => {
    const raw: ReportDefinition = {
      schemaVersion: '1.0.0',
      reportId: 'test-report',
      name: 'Test Report',
      pageSettings: {
        paperSize: 'A4',
        orientation: 'portrait',
        margins: { top: 10, bottom: 10, left: 10, right: 10, unit: 'mm' },
      },
      parameters: [],
      dataSources: [],
      datasets: [],
      sections: [
        {
          id: 'sec-header',
          name: 'ReportHeader',
          type: 'ReportHeader',
          height: 40,
          visible: true,
          canGrow: false,
          keepTogether: false,
          components: [
            {
              id: 'comp-title',
              name: 'TitleBox',
              type: 'TextBox',
              x: 10,
              y: 10,
              width: 180,
              height: 20,
              value: 'Sales Invoice',
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
      ],
    };

    const res = validateReportDefinition(raw);
    expect(res.success).toBe(true);
  });

  it('rejects invalid schema missing reportId', () => {
    const res = validateReportDefinition({
      name: 'No ID',
    });
    expect(res.success).toBe(false);
  });
});
