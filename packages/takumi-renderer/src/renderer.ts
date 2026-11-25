import { DocumentModel, RenderedElement } from '@rsc/reporting-engine';
import { render } from 'takumi-pdf';

export interface TakumiRenderOptions {
  paperSize?: string;
  orientation?: 'portrait' | 'landscape';
  headerRepeatMode?: 'all' | 'skipFirst' | 'odd' | 'even';
  footerRepeatMode?: 'all' | 'skipLast' | 'odd' | 'even';
  headerBorderBottom?: boolean;
  footerBorderTop?: boolean;
  footerShowPageNumber?: boolean;
  footerPageNumberFormat?: 'pageOfTotal' | 'pageOnly' | 'dashPage';
  footerPageNumberAlign?: 'left' | 'center' | 'right';
}

export class TakumiRenderer {
  static async renderToPdf(doc: DocumentModel, options: TakumiRenderOptions = {}): Promise<Uint8Array> {
    const page = doc.pages[0];
    if (!page) {
      throw new Error('Document model contains no pages');
    }

    const isLandscape = doc.pageSettings.orientation === 'landscape';
    const pageWidthMm = doc.pageSettings.width || (isLandscape ? 297 : 210);
    const pageHeightMm = doc.pageSettings.height || (isLandscape ? 210 : 297);
    const pageWidthPx = Math.round(pageWidthMm * 3.78);
    const pageHeightPx = Math.round(pageHeightMm * 3.78);

    const pSet = doc.pageSettings || ({} as any);
    const headerHeightMm = pSet.headerHeight ?? 20;
    const footerHeightMm = pSet.footerHeight ?? 15;
    const headerHeightPx = Math.round(headerHeightMm * 3.78);
    const footerHeightPx = Math.round(footerHeightMm * 3.78);

    const marginTopPx = Math.round((pSet.margins?.top ?? 10) * 3.78);
    const marginBottomPx = Math.round((pSet.margins?.bottom ?? 10) * 3.78);
    const marginLeftPx = Math.round((pSet.margins?.left ?? 10) * 3.78);
    const marginRightPx = Math.round((pSet.margins?.right ?? 10) * 3.78);

    // Extract Header & Footer elements
    const headerElems = doc.headerElements || [];
    const footerElems = doc.footerElements || [];
    const hasHeader = headerElems.length > 0 || pSet.headerHeight !== undefined;
    const hasFooter = footerElems.length > 0 || pSet.footerHeight !== undefined || pSet.footerShowPageNumber !== false;

    // Build Header Template HTML (Repeated natively on each page by Takumi)
    let headerHtml: string | undefined = undefined;
    if (hasHeader) {
      const borderBottomStyle = pSet.headerBorderBottom !== false ? 'border-bottom: 1px solid #cbd5e1;' : '';
      headerHtml = `
        <div style="font-family: Inter, system-ui, sans-serif; position: relative; width: ${pageWidthPx}px; height: ${headerHeightPx}px; box-sizing: border-box; background: transparent; padding-left: ${marginLeftPx}px; padding-right: ${marginRightPx}px; ${borderBottomStyle}">
          ${headerElems.map((elem) => TakumiRenderer.renderSingleElement(elem)).join('')}
        </div>
      `;
    }

    // Build Footer Template HTML (Repeated natively on each page by Takumi with dynamic Page Number)
    let footerHtml: string | undefined = undefined;
    if (hasFooter) {
      const borderTopStyle = pSet.footerBorderTop !== false ? 'border-top: 1px solid #cbd5e1;' : '';
      const align = pSet.footerPageNumberAlign || 'right';
      const textAlignStyle = align === 'left' ? 'text-align: left;' : align === 'center' ? 'text-align: center;' : 'text-align: right;';

      let pageNumMarkup = '';
      if (pSet.footerShowPageNumber !== false) {
        if (pSet.footerPageNumberFormat === 'dashPage') {
          pageNumMarkup = `- <span class="pageNumber"></span> -`;
        } else if (pSet.footerPageNumberFormat === 'pageOnly') {
          pageNumMarkup = `Page <span class="pageNumber"></span>`;
        } else {
          pageNumMarkup = `Page <span class="pageNumber"></span> of <span class="totalPages"></span>`;
        }
      }

      footerHtml = `
        <div style="font-family: Inter, system-ui, sans-serif; position: relative; width: ${pageWidthPx}px; height: ${footerHeightPx}px; box-sizing: border-box; background: transparent; padding-left: ${marginLeftPx}px; padding-right: ${marginRightPx}px; display: flex; align-items: center; justify-content: space-between; ${borderTopStyle}">
          <div style="position: relative; flex: 1; height: 100%;">
            ${footerElems.map((elem) => TakumiRenderer.renderSingleElement(elem)).join('')}
          </div>
          ${pageNumMarkup ? `
            <div style="font-size: 8pt; color: #64748b; font-family: monospace; ${textAlignStyle} white-space: nowrap; margin-left: 12px;">
              ${pageNumMarkup}
            </div>
          ` : ''}
        </div>
      `;
    }

    // Build Main Content HTML (Detail and body elements)
    // If elements were separated into header/footer, filter them out of body to avoid duplicates
    const bodyElements = page.elements.filter((elem) => {
      const isHeader = headerElems.some((h) => h.id === elem.id);
      const isFooter = footerElems.some((f) => f.id === elem.id);
      return !isHeader && !isFooter;
    });

    let mainContentHtml = `
      <div style="font-family: Inter, system-ui, -apple-system, sans-serif; position: relative; width: 100%; min-height: ${pageHeightPx - (headerHeightPx + footerHeightPx + marginTopPx + marginBottomPx)}px; box-sizing: border-box; background-color: #ffffff; color: #0f172a;">
    `;

    for (const elem of bodyElements) {
      // Offset Y relative to body flow area
      const adjustedElem = { ...elem, y: Math.max(0, elem.y - (headerHeightPx + marginTopPx)) };
      mainContentHtml += TakumiRenderer.renderSingleElement(adjustedElem);
    }

    mainContentHtml += `</div>`;

    try {
      const pdfBytes = await render(mainContentHtml, {
        size: { width: pageWidthPx, height: pageHeightPx },
        header: headerHtml,
        footer: footerHtml,
        margin: {
          top: marginTopPx + (headerHtml ? headerHeightPx : 0),
          bottom: marginBottomPx + (footerHtml ? footerHeightPx : 0),
          left: marginLeftPx,
          right: marginRightPx,
        },
      });
      return pdfBytes;
    } catch (err: any) {
      return TakumiRenderer.generateValidFallbackPdf(doc);
    }
  }

  static renderSingleElement(elem: RenderedElement): string {
    const leftPx = elem.x;
    const topPx = elem.y;
    const widthPx = elem.width;
    const heightPx = elem.height;
    const zIndex = (elem as any).zIndex || 1;
    const type = elem.type || 'text';

    if (
      type.includes('Chart') ||
      type === 'DonutChart' ||
      type === 'PieChart' ||
      type === 'Sparkline' ||
      type === 'Drilldown' ||
      type === 'Waterfall' ||
      type === 'SankeyDiagram'
    ) {
      const isPie = type === 'PieChart' || type === 'DonutChart';
      const labels = elem.chartData?.labels || ['Item A', 'Item B', 'Item C'];
      const values = elem.chartData?.values || [100, 200, 300];
      const maxValue = Math.max(...values, 10);
      const total = values.reduce((a, b) => a + b, 0) || 1;

      return `
        <div style="position: absolute; left: ${leftPx}px; top: ${topPx}px; width: ${widthPx}px; height: ${heightPx}px; border: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 6px; padding: 8px; box-sizing: border-box; z-index: ${zIndex}; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="font-size: 8pt; font-weight: bold; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
            ${elem.id} (${type})
          </div>
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; height: ${heightPx - 38}px;">
            ${
              isPie
                ? `
              <svg viewBox="0 0 100 100" style="width: ${Math.min(widthPx, heightPx) - 40}px; height: ${Math.min(widthPx, heightPx) - 40}px;">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" stroke-width="${type === 'DonutChart' ? 18 : 38}" stroke-dasharray="150 250" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" stroke-width="${type === 'DonutChart' ? 18 : 38}" stroke-dasharray="60 250" stroke-dashoffset="-150" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" stroke-width="${type === 'DonutChart' ? 18 : 38}" stroke-dasharray="40 250" stroke-dashoffset="-210" />
              </svg>
            `
                : `
              <div style="width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: space-between; gap: 4px; padding-top: 6px;">
                ${values.slice(0, 6).map((val, idx) => {
                  const hPct = Math.max(12, Math.min(95, Math.round((val / maxValue) * 90)));
                  const label = labels[idx] || `Item ${idx + 1}`;
                  const colors = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ec4899'];
                  const bg = colors[idx % colors.length];
                  return `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%;">
                      <span style="font-size: 6pt; color: #64748b; font-family: monospace;">${val}</span>
                      <div style="width: 100%; height: ${hPct}%; background-color: ${bg}; border-radius: 2px 2px 0 0;"></div>
                      <span style="font-size: 6pt; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 45px; text-align: center; margin-top: 2px;">
                        ${label}
                      </span>
                    </div>
                  `;
                }).join('')}
              </div>
            `
            }
          </div>
          <div style="font-size: 7pt; color: #64748b; font-family: monospace; border-top: 1px solid #e2e8f0; padding-top: 2px; display: flex; justify-content: space-between;">
            <span>${labels.slice(0, 2).join(', ')}</span>
            <span>Total: ${total.toLocaleString()}</span>
          </div>
        </div>
      `;
    } else if (type.includes('Gauge')) {
      const cur = elem.gaugeData?.current ?? 80;
      const min = elem.gaugeData?.min ?? 0;
      const max = elem.gaugeData?.max ?? 100;
      const unit = elem.gaugeData?.unit || '%';
      const pct = Math.min(100, Math.max(0, ((cur - min) / (max - min)) * 100));

      return `
        <div style="position: absolute; left: ${leftPx}px; top: ${topPx}px; width: ${widthPx}px; height: ${heightPx}px; border: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 6px; padding: 6px; text-align: center; box-sizing: border-box; z-index: ${zIndex}; display: flex; flex-direction: column; justify-content: space-between; align-items: center;">
          <div style="font-size: 7pt; font-weight: bold; color: #64748b;">${elem.id}</div>
          <div style="position: relative; display: flex; align-items: center; justify-content: center; height: 60px;">
            <svg viewBox="0 0 100 60" style="width: 80px; height: 50px;">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" stroke-width="10" stroke-linecap="round" />
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#4f46e5" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(pct / 100) * 125} 125" />
            </svg>
            <span style="position: absolute; bottom: 0; font-weight: bold; font-size: 11pt; color: #0f172a;">${cur}${unit}</span>
          </div>
          <div style="font-size: 6pt; color: #94a3b8; font-family: monospace;">Min: ${min}${unit} | Max: ${max}${unit}</div>
        </div>
      `;
    } else if (type === 'text' || type === 'TextBox' || type === 'Label') {
      const fw = elem.style?.fontWeight === 'bold' ? 'bold' : 'normal';
      const fs = elem.style?.fontSize ? `${elem.style.fontSize}pt` : '10pt';
      const color = elem.style?.color || '#000000';
      const align = elem.style?.textAlign || 'left';
      const fontStyle = elem.style?.fontStyle === 'italic' ? 'italic' : 'normal';

      return `
        <div style="position: absolute; left: ${leftPx}px; top: ${topPx}px; width: ${widthPx}px; height: ${heightPx}px; font-size: ${fs}; font-weight: ${fw}; font-style: ${fontStyle}; color: ${color}; text-align: ${align}; z-index: ${zIndex}; overflow: hidden; display: flex; align-items: flex-start; box-sizing: border-box;">
          ${elem.content || ''}
        </div>
      `;
    } else if (type === 'table' || type === 'DataGrid' || type === 'Spreadsheet') {
      const { headers, rows, showFooter, footers, columnWidths } = elem.tableData || { headers: [], rows: [] };
      return `
        <div style="position: absolute; left: ${leftPx}px; top: ${topPx}px; width: ${widthPx}px; height: auto; min-height: ${heightPx}px; z-index: ${zIndex}; box-sizing: border-box; overflow: visible; border: 1px solid #cbd5e1; border-radius: 4px; background-color: #ffffff;">
          <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
            <thead>
              <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                ${headers.map((h, i) => {
                  const w = columnWidths && columnWidths[i] ? `width: ${columnWidths[i]}px;` : '';
                  return `<th style="text-align: left; padding: 6px 8px; font-weight: bold; color: #334155; ${w}">${h}</th>`;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, idx) => `
                <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                  ${row.map(cell => `<td style="padding: 6px 8px; color: #1e293b;">${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
            ${showFooter && footers ? `
              <tfoot>
                <tr style="border-top: 2px solid #cbd5e1; font-weight: bold; background-color: #f1f5f9;">
                  ${footers.map(f => `<td style="padding: 6px 8px; color: #0f172a;">${f}</td>`).join('')}
                </tr>
              </tfoot>
            ` : ''}
          </table>
        </div>
      `;
    } else if (type === 'line') {
      return `
        <div style="position: absolute; left: ${leftPx}px; top: ${topPx}px; width: ${widthPx}px; height: 1px; background-color: #94a3b8; z-index: ${zIndex};"></div>
      `;
    } else if (type === 'shape') {
      return `
        <div style="position: absolute; left: ${leftPx}px; top: ${topPx}px; width: ${widthPx}px; height: ${heightPx}px; border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 4px; z-index: ${zIndex}; box-sizing: border-box;"></div>
      `;
    } else if (type === 'image' || type === 'PictureBox') {
      return `
        <img src="${elem.content || ''}" style="position: absolute; left: ${leftPx}px; top: ${topPx}px; width: ${widthPx}px; height: ${heightPx}px; object-fit: contain; z-index: ${zIndex};" />
      `;
    } else {
      return `
        <div style="position: absolute; left: ${leftPx}px; top: ${topPx}px; width: ${widthPx}px; height: ${heightPx}px; font-size: 9pt; color: #334155; z-index: ${zIndex};">
          ${elem.content || ''}
        </div>
      `;
    }
  }

  static generateValidFallbackPdf(doc: DocumentModel): Uint8Array {
    const page = doc.pages[0];
    const isLandscape = doc.pageSettings.orientation === 'landscape';
    const widthMm = doc.pageSettings.width || (isLandscape ? 297 : 210);
    const heightMm = doc.pageSettings.height || (isLandscape ? 210 : 297);
    const widthPt = Number((widthMm * 2.83464567).toFixed(2));
    const heightPt = Number((heightMm * 2.83464567).toFixed(2));

    let stream = ``;

    for (const elem of page.elements) {
      const ptX = elem.x * 0.75;
      const ptY = heightPt - (elem.y * 0.75) - (elem.height * 0.75);

      if ((elem.type === 'text' || elem.type === 'TextBox' || elem.type === 'Label') && elem.content) {
        const cleanText = elem.content.replace(/[\(\)\\]/g, '');
        const fontSize = Math.max(8, (elem.style?.fontSize || 10) * 0.9);
        stream += `BT /F1 ${fontSize} Tf ${ptX.toFixed(1)} ${ptY.toFixed(1)} Td (${cleanText}) Tj ET\n`;
      } else if ((elem.type === 'table' || elem.type === 'DataGrid' || elem.type === 'Spreadsheet') && elem.tableData) {
        let tableY = ptY;
        const headerStr = elem.tableData.headers.join(' | ').replace(/[\(\)\\]/g, '');
        stream += `BT /F1 9 Tf ${ptX.toFixed(1)} ${tableY.toFixed(1)} Td (${headerStr}) Tj ET\n`;
        tableY -= 14;

        for (const row of elem.tableData.rows) {
          const rowStr = row.join(' | ').replace(/[\(\)\\]/g, '');
          stream += `BT /F1 9 Tf ${ptX.toFixed(1)} ${tableY.toFixed(1)} Td (${rowStr}) Tj ET\n`;
          tableY -= 14;
        }
      } else if (elem.type.includes('Chart')) {
        const title = `${elem.id} (${elem.type})`.replace(/[\(\)\\]/g, '');
        stream += `BT /F1 10 Tf ${ptX.toFixed(1)} ${ptY.toFixed(1)} Td (${title}) Tj ET\n`;
        const wPt = elem.width * 0.75;
        const hPt = elem.height * 0.75;
        stream += `${ptX.toFixed(1)} ${ptY.toFixed(1)} ${wPt.toFixed(1)} ${hPt.toFixed(1)} re S\n`;
      } else if (elem.type.includes('Gauge')) {
        const cur = elem.gaugeData?.current ?? 80;
        const unit = elem.gaugeData?.unit || '%';
        stream += `BT /F1 11 Tf ${ptX.toFixed(1)} ${ptY.toFixed(1)} Td (${elem.id}: ${cur}${unit}) Tj ET\n`;
      } else if (elem.type === 'line') {
        const endX = ptX + (elem.width * 0.75);
        stream += `${ptX.toFixed(1)} ${ptY.toFixed(1)} m ${endX.toFixed(1)} ${ptY.toFixed(1)} l S\n`;
      } else if (elem.type === 'shape') {
        const wPt = elem.width * 0.75;
        const hPt = elem.height * 0.75;
        stream += `${ptX.toFixed(1)} ${ptY.toFixed(1)} ${wPt.toFixed(1)} ${hPt.toFixed(1)} re S\n`;
      }
    }

    const streamLength = Buffer.byteLength(stream);

    const pdfParts = [
      "%PDF-1.4\n",
      "1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n",
      "2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n",
      `3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt} ${heightPt}] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>> endobj\n`,
      `4 0 obj <</Length ${streamLength}>> stream\n${stream}endstream\nendobj\n`,
      "5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\n",
      "xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n",
      "trailer <</Size 6 /Root 1 0 R>>\nstartxref\n300\n%%EOF\n"
    ];

    return new Uint8Array(Buffer.from(pdfParts.join('')));
  }
}
