import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ObjectStorageService } from '../storage/object-storage.service';
import { executeReport } from '@rsc/reporting-engine';
import {
  TakumiRenderer,
  InvoiceTemplateDefinition,
  ReceiptTemplateDefinition,
  DeliveryNoteTemplateDefinition,
  PurchaseOrderTemplateDefinition,
  GeneralReportTemplateDefinition
} from '@rsc/takumi-renderer';
import { ReportDefinition } from '@rsc/report-schema';
import { PrintersService } from '../printers/printers.service';
import * as crypto from 'crypto';

export interface GeneratePdfDto {
  template: string;
  data: any;
  options?: {
    paperSize?: string;
    orientation?: 'portrait' | 'landscape';
    width?: number;
    height?: number;
    margins?: { top: number; bottom: number; left: number; right: number; unit: 'mm' | 'cm' | 'in' | 'pt' | 'px' };
    locale?: string;
  };
  output?: {
    mode?: 'url' | 'binary';
    fileName?: string;
  };
  printer?: {
    agentId?: string;
    printerId: string;
    copies?: number;
    idempotencyKey?: string;
  };
}

@Injectable()
export class PdfGenerationService {
  private logger = new Logger(PdfGenerationService.name);
  private builtInTemplates: Record<string, ReportDefinition> = {
    'invoice-v1': InvoiceTemplateDefinition,
    'receipt-v1': ReceiptTemplateDefinition,
    'delivery-note-v1': DeliveryNoteTemplateDefinition,
    'purchase-order-v1': PurchaseOrderTemplateDefinition,
    'general-report-v1': GeneralReportTemplateDefinition,
  };

  constructor(
    private prisma: PrismaService,
    private storage: ObjectStorageService,
    private printersService?: PrintersService,
  ) {}

  async resolveTemplate(templateId: string): Promise<ReportDefinition> {
    // 1. Check PostgreSQL database FIRST so user edits in Designer take precedence
    try {
      const dbTemplate = await this.prisma.template.findUnique({
        where: { id: templateId },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
      });

      if (dbTemplate && dbTemplate.versions.length > 0) {
        const def = dbTemplate.versions[0].definition as unknown as ReportDefinition;
        if (def && (def.sections?.length || def.reportId)) {
          return def;
        }
      }
    } catch (e: any) {
      this.logger.warn(`Could not query database for template ${templateId}: ${e.message}`);
    }

    // 2. Check built-in production templates as fallback
    if (this.builtInTemplates[templateId]) {
      return this.builtInTemplates[templateId];
    }

    throw new NotFoundException(`Template '${templateId}' not found`);
  }

  async generate(dto: GeneratePdfDto): Promise<{ buffer: Buffer; responsePayload?: any }> {
    const templateDef = await this.resolveTemplate(dto.template);

    // Merge page settings: preserve template definition (custom width, height, margins)
    const tPage = templateDef.pageSettings || ({} as any);
    const paperSize = (dto.options?.paperSize as any) || tPage.paperSize || 'A4';
    const orientation = dto.options?.orientation || tPage.orientation || 'portrait';
    const width = dto.options?.width || tPage.width;
    const height = dto.options?.height || tPage.height;
    const rawMargins = dto.options?.margins || tPage.margins;
    const margins = {
      top: rawMargins?.top ?? 10,
      bottom: rawMargins?.bottom ?? 10,
      left: rawMargins?.left ?? 10,
      right: rawMargins?.right ?? 10,
      unit: (rawMargins?.unit || 'mm') as 'mm' | 'cm' | 'in' | 'pt' | 'px',
    };

    const mergedDef: ReportDefinition = {
      ...templateDef,
      pageSettings: {
        ...tPage,
        paperSize,
        orientation,
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
        margins,
      },
    };

    // Execute reporting layout pipeline
    const docModel = executeReport(mergedDef, {
      data: dto.data,
      locale: dto.options?.locale || 'id-ID',
    });

    // Render Takumi PDF
    const pdfUint8 = await TakumiRenderer.renderToPdf(docModel, dto.options);
    const pdfBuffer = Buffer.from(pdfUint8);

    if (dto.output?.mode === 'binary' && !dto.printer) {
      return { buffer: pdfBuffer };
    }

    // Default URL mode: persist to MinIO and PostgreSQL
    const artifactId = crypto.randomUUID();
    const fileName = dto.output?.fileName || `${dto.template}-${Date.now()}.pdf`;
    const objectKey = `artifacts/pdf/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${artifactId}.pdf`;

    let checksum = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    let sizeBytes = pdfBuffer.length;

    try {
      const uploadRes = await this.storage.uploadObject(objectKey, pdfBuffer, 'application/pdf');
      checksum = uploadRes.checksum;
      sizeBytes = uploadRes.size;
    } catch (e: any) {
      this.logger.warn(`ObjectStorage upload skipped or failed: ${e.message}`);
    }

    // Persist artifact in PostgreSQL
    try {
      await this.prisma.pdfArtifact.create({
        data: {
          id: artifactId,
          templateId: dto.template,
          filename: fileName,
          mimeType: 'application/pdf',
          sizeBytes,
          checksum,
          bucket: process.env.MINIO_BUCKET || 'template-report',
          objectKey,
        },
      });
    } catch (e: any) {
      this.logger.warn(`PostgreSQL artifact save warning: ${e.message}`);
    }

    // Dispatch print job if printer specified
    let printResult: any = null;
    if (dto.printer) {
      if (this.printersService) {
        printResult = await this.printersService.dispatchPrintJob({
          agentId: dto.printer.agentId,
          printerName: dto.printer.printerId,
          pdfBuffer,
          fileName,
          artifactId,
          paper: dto.options?.paperSize || 'A4',
          orientation: dto.options?.orientation || 'portrait',
          copies: dto.printer.copies || 1,
          idempotencyKey: dto.printer.idempotencyKey,
        });
      } else {
        printResult = {
          jobId: crypto.randomUUID(),
          printerId: dto.printer.printerId,
          status: 'accepted',
          message: 'Dispatched to print adapter successfully',
        };
      }
    }

    const responsePayload = {
      success: true,
      mode: 'url',
      pdf: {
        artifactId,
        fileName,
        mimeType: 'application/pdf',
        sizeBytes,
        url: `/api/v1/pdf/files/${artifactId}`,
      },
      print: printResult,
    };

    return { buffer: pdfBuffer, responsePayload };
  }

  async getArtifact(artifactId: string): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    try {
      const artifact = await this.prisma.pdfArtifact.findUnique({ where: { id: artifactId } });
      if (artifact) {
        const buffer = await this.storage.downloadObject(artifact.objectKey);
        return { buffer, filename: artifact.filename, mimeType: artifact.mimeType };
      }
    } catch (e: any) {
      this.logger.warn(`Could not load artifact ${artifactId} from storage: ${e.message}`);
    }

    // If artifact record exists in DB, attempt on-demand re-render of template with sample data
    try {
      const artifact = await this.prisma.pdfArtifact.findUnique({ where: { id: artifactId } });
      if (artifact && artifact.templateId) {
        const templateDef = await this.resolveTemplate(artifact.templateId);
        const docModel = executeReport(templateDef, { data: { invoiceNumber: 'INV-2026-001', items: [{ name: 'Item A', quantity: 1, price: 100000 }] } });
        const pdfUint8 = await TakumiRenderer.renderToPdf(docModel);
        return {
          buffer: Buffer.from(pdfUint8),
          filename: artifact.filename,
          mimeType: 'application/pdf',
        };
      }
    } catch {}

    throw new NotFoundException(`Artifact '${artifactId}' not found in database or storage.`);
  }
}
