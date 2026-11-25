import { describe, it, expect } from 'vitest';
import { PdfGenerationService } from './modules/pdf/pdf-generation.service';
import { PrismaService } from './common/prisma.service';
import { ObjectStorageService } from './modules/storage/object-storage.service';

describe('PdfGenerationService Unit Tests', () => {
  it('generates PDF in URL mode with valid artifact URL and metadata', async () => {
    const prisma = new PrismaService();
    const storage = new ObjectStorageService();
    const service = new PdfGenerationService(prisma, storage);

    const result = await service.generate({
      template: 'invoice-v1',
      data: {
        invoiceNumber: 'INV-TEST-001',
        date: '2026-10-29',
        customer: { name: 'Test Corp' },
        items: [{ name: 'Test Item', quantity: 1, price: 100000 }],
      },
    });

    expect(result.responsePayload).toBeDefined();
    expect(result.responsePayload.success).toBe(true);
    expect(result.responsePayload.pdf.artifactId).toBeDefined();
    expect(result.responsePayload.pdf.url).toContain('/api/v1/pdf/files/');
  });

  it('generates PDF in binary mode', async () => {
    const prisma = new PrismaService();
    const storage = new ObjectStorageService();
    const service = new PdfGenerationService(prisma, storage);

    const result = await service.generate({
      template: 'receipt-v1',
      data: {
        invoiceNumber: 'REC-001',
        date: '2026-10-29',
        items: [{ name: 'Coffee', quantity: 2, price: 35000 }],
      },
      output: { mode: 'binary', fileName: 'test-receipt.pdf' },
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(100);
    expect(result.buffer.slice(0, 5).toString()).toBe('%PDF-');
  });
});
