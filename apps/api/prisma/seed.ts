import { PrismaClient } from '@prisma/client';
import {
  InvoiceTemplateDefinition,
  ReceiptTemplateDefinition,
  DeliveryNoteTemplateDefinition,
  PurchaseOrderTemplateDefinition,
  GeneralReportTemplateDefinition
} from '@rsc/takumi-renderer';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const seeds = [
  { id: 'invoice-v1', name: 'Commercial Invoice', category: 'Financial', desc: 'Standard business billing invoice', def: InvoiceTemplateDefinition },
  { id: 'receipt-v1', name: 'Payment Receipt', category: 'Financial', desc: 'Customer point-of-sale receipt', def: ReceiptTemplateDefinition },
  { id: 'delivery-note-v1', name: 'Delivery Note', category: 'Logistics', desc: 'Logistics fulfillment sheet', def: DeliveryNoteTemplateDefinition },
  { id: 'purchase-order-v1', name: 'Purchase Order', category: 'Operations', desc: 'Vendor purchase order', def: PurchaseOrderTemplateDefinition },
  { id: 'general-report-v1', name: 'General Analytical Report', category: 'Analytics', desc: 'Analytics report with grouping', def: GeneralReportTemplateDefinition },
];

async function seed() {
  console.log('Seeding initial production templates into PostgreSQL...');

  for (const s of seeds) {
    const checksum = crypto.createHash('sha256').update(JSON.stringify(s.def)).digest('hex');

    await prisma.template.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        name: s.name,
        description: s.desc,
        category: s.category,
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            definition: s.def as any,
            definitionChecksum: checksum,
            changeDescription: 'Initial production seed',
          },
        },
      },
      update: {
        name: s.name,
        description: s.desc,
        category: s.category,
      },
    });
    console.log(`✓ Template seeded: ${s.id}`);
  }

  console.log('Seeding completed successfully.');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
