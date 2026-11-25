import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  InvoiceTemplateDefinition,
  ReceiptTemplateDefinition,
  DeliveryNoteTemplateDefinition,
  PurchaseOrderTemplateDefinition,
  GeneralReportTemplateDefinition
} from '@rsc/takumi-renderer';
import * as crypto from 'crypto';

@Controller('api/v1/templates')
export class TemplatesController {
  private logger = new Logger(TemplatesController.name);

  private builtIns: Record<string, any> = {
    'invoice-v1': { meta: { id: 'invoice-v1', name: 'Standard Commercial Invoice', category: 'Financial', currentVersion: 1 }, def: InvoiceTemplateDefinition },
    'receipt-v1': { meta: { id: 'receipt-v1', name: 'Payment Receipt', category: 'Financial', currentVersion: 1 }, def: ReceiptTemplateDefinition },
    'delivery-note-v1': { meta: { id: 'delivery-note-v1', name: 'Delivery Note', category: 'Logistics', currentVersion: 1 }, def: DeliveryNoteTemplateDefinition },
    'purchase-order-v1': { meta: { id: 'purchase-order-v1', name: 'Purchase Order', category: 'Operations', currentVersion: 1 }, def: PurchaseOrderTemplateDefinition },
    'general-report-v1': { meta: { id: 'general-report-v1', name: 'General Data Report', category: 'Analytics', currentVersion: 1 }, def: GeneralReportTemplateDefinition },
  };

  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    const builtInList = Object.values(this.builtIns).map(b => b.meta);

    if (this.prisma.isConnected) {
      try {
        const dbTemplates = await this.prisma.template.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            currentVersion: true,
            updatedAt: true,
          },
        });
        // Merge DB templates avoiding duplicate IDs
        const dbIds = new Set(dbTemplates.map(t => t.id));
        const filteredBuiltins = builtInList.filter(b => !dbIds.has(b.id));
        return [...dbTemplates, ...filteredBuiltins];
      } catch (err: any) {
        this.logger.warn(`Could not list templates from PostgreSQL: ${err.message}`);
      }
    }

    return builtInList;
  }

  @Get(':templateId')
  async get(@Param('templateId') templateId: string) {
    // 1. Try PostgreSQL Database
    if (this.prisma.isConnected) {
      try {
        const dbTemplate = await this.prisma.template.findUnique({
          where: { id: templateId },
          include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
        });

        if (dbTemplate && dbTemplate.versions.length > 0) {
          return {
            id: dbTemplate.id,
            name: dbTemplate.name,
            description: dbTemplate.description,
            category: dbTemplate.category,
            currentVersion: dbTemplate.currentVersion,
            definition: dbTemplate.versions[0].definition,
            source: 'database',
          };
        }
      } catch (err: any) {
        this.logger.warn(`Failed reading template ${templateId} from PostgreSQL: ${err.message}`);
      }
    }

    // 2. Built-in template fallback
    if (this.builtIns[templateId]) {
      return {
        id: templateId,
        name: this.builtIns[templateId].meta.name,
        category: this.builtIns[templateId].meta.category,
        currentVersion: 1,
        definition: this.builtIns[templateId].def,
        source: 'built-in',
      };
    }

    throw new NotFoundException(`Template '${templateId}' not found in database or built-ins.`);
  }

  @Put(':templateId')
  async saveOrUpdate(@Param('templateId') templateId: string, @Body() body: any) {
    const { name, description, category, definition } = body;
    const defString = JSON.stringify(definition || {});
    const checksum = crypto.createHash('sha256').update(defString).digest('hex');

    if (this.prisma.isConnected) {
      try {
        // Upsert Template
        const existing = await this.prisma.template.findUnique({ where: { id: templateId } });
        const nextVersion = existing ? existing.currentVersion + 1 : 1;

        const template = await this.prisma.template.upsert({
          where: { id: templateId },
          create: {
            id: templateId,
            name: name || templateId,
            description: description || '',
            category: category || 'General',
            currentVersion: nextVersion,
            versions: {
              create: {
                version: nextVersion,
                definition: definition || {},
                definitionChecksum: checksum,
                changeDescription: `Updated from visual designer at ${new Date().toISOString()}`,
              },
            },
          },
          update: {
            name: name || undefined,
            description: description || undefined,
            category: category || undefined,
            currentVersion: nextVersion,
            versions: {
              create: {
                version: nextVersion,
                definition: definition || {},
                definitionChecksum: checksum,
                changeDescription: `Updated from visual designer at ${new Date().toISOString()}`,
              },
            },
          },
        });

        return {
          success: true,
          templateId,
          version: nextVersion,
          savedTo: 'database',
          checksum,
        };
      } catch (err: any) {
        this.logger.error(`Error saving template ${templateId} to PostgreSQL: ${err.message}`);
        throw err;
      }
    }

    // In-memory update if DB is disconnected
    if (this.builtIns[templateId]) {
      this.builtIns[templateId].def = definition;
    } else {
      this.builtIns[templateId] = {
        meta: { id: templateId, name: name || templateId, category: category || 'General', currentVersion: 1 },
        def: definition,
      };
    }

    return {
      success: true,
      templateId,
      version: 1,
      savedTo: 'memory-fallback',
      warning: 'PostgreSQL disconnected. Definition cached in-memory.',
    };
  }

  @Post()
  async create(@Body() body: any) {
    return this.saveOrUpdate(body.id, body);
  }
}
