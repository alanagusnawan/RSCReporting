import { Controller, Get, Post, Patch, Delete, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { PrintersService } from './printers.service';

@Controller('api/v1/printers')
export class PrintersController {
  constructor(
    private printersService: PrintersService,
  ) {}

  @Get()
  list() {
    return this.printersService.getOnlinePrinters();
  }

  @Get('agents')
  listAgents() {
    return this.printersService.getRegisteredAgents();
  }

  @Patch('agents/:agentId')
  async updateAgent(
    @Param('agentId') agentId: string,
    @Body() body: { name?: string },
  ) {
    return this.printersService.updateAgent(agentId, body);
  }

  @Delete('agents/:agentId')
  async deleteAgent(@Param('agentId') agentId: string) {
    return this.printersService.deleteAgent(agentId);
  }

  @Get('agents/:agentId/options')
  async getAgentOptions(@Param('agentId') agentId: string) {
    try {
      return await this.printersService.getAgentOptions(agentId);
    } catch (err: any) {
      throw new HttpException(
        {
          success: false,
          message: err.message || 'Gagal mengambil options dari Print Agent.',
        },
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }
  }

  @Get('agents/:agentId/printers')
  async getAgentPrintersDetail(@Param('agentId') agentId: string) {
    return this.printersService.getAgentPrintersDetail(agentId);
  }

  @Post('agents/:agentId/printers/:printerName/share')
  async sharePrinter(
    @Param('agentId') agentId: string,
    @Param('printerName') printerName: string,
    @Body() body: { protocol?: string; shareName?: string },
  ) {
    return this.printersService.sharePrinter(agentId, printerName, body.protocol, body.shareName);
  }

  @Post('agents/:agentId/printers/:printerName/unshare')
  async unsharePrinter(
    @Param('agentId') agentId: string,
    @Param('printerName') printerName: string,
  ) {
    return this.printersService.unsharePrinter(agentId, printerName);
  }

  @Post('install-to-agents')
  async installToAgents(
    @Body()
    body: {
      sourceAgentId: string;
      sourcePrinterName: string;
      targetAgentIds: string[];
      targetQueueName?: string;
      isDefault?: boolean;
    },
  ) {
    return this.printersService.installToAgents(body);
  }

  @Get('shares')
  async listShares() {
    return this.printersService.getPrinterShares();
  }

  @Delete('shares/:shareId')
  async uninstallShare(@Param('shareId') shareId: string) {
    return this.printersService.uninstallPrinterShare(shareId);
  }

  @Get('audit-logs')
  async listAuditLogs() {
    return this.printersService.getAuditLogs();
  }

  @Post('agents/:agentId/printers/:printerName/default')
  async setDefaultPrinter(
    @Param('agentId') agentId: string,
    @Param('printerName') printerName: string,
  ) {
    return this.printersService.setDefaultPrinter(agentId, printerName);
  }

  @Delete('agents/:agentId/printers/:printerName')
  async deletePrinter(
    @Param('agentId') agentId: string,
    @Param('printerName') printerName: string,
  ) {
    return this.printersService.deletePrinter(agentId, printerName);
  }

  @Post('register')
  async registerPrinter(
    @Body()
    body: {
      agentId: string;
      name: string;
      driverName?: string;
      printerType: string;
      portOrUri: string;
      isDefault?: boolean;
    },
  ) {
    return this.printersService.registerPrinter(body);
  }

  @Get(':printerId')
  getOne(@Param('printerId') printerId: string) {
    const online = this.printersService.getOnlinePrinters();
    const match = online.find((p) => p.id === printerId);
    return match || { id: printerId, name: `${printerId} (Offline)`, status: 'offline' };
  }

  @Post(':printerId/test')
  async testPrint(@Param('printerId') printerId: string) {
    // Generate simple minimal PDF buffer for testing
    const testPdfParts = [
      "%PDF-1.4\n",
      "1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n",
      "2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n",
      "3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>> endobj\n",
      "4 0 obj <</Length 62>> stream\nBT /F1 14 Tf 50 780 Td (Test Print Page from RSC Reporting) Tj ET\nendstream\nendobj\n",
      "5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\n",
      "xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n",
      "trailer <</Size 6 /Root 1 0 R>>\nstartxref\n300\n%%EOF\n"
    ];
    const pdfBuffer = Buffer.from(testPdfParts.join(''));

    const result = await this.printersService.dispatchPrintJob({
      printerName: printerId,
      pdfBuffer,
      fileName: `test-page-${printerId}.pdf`,
      paper: 'A4',
      orientation: 'portrait',
      copies: 1,
    });

    return {
      success: result.status === 'accepted',
      result,
    };
  }
}

@Controller('api/v1/pdf/print-jobs')
export class PrintJobsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listJobs() {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.printJob.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
      } catch {
        return [];
      }
    }
    return [];
  }

  @Get(':jobId')
  async getJob(@Param('jobId') jobId: string) {
    if (this.prisma.isConnected) {
      try {
        const job = await this.prisma.printJob.findUnique({ where: { id: jobId } });
        if (job) return job;
      } catch {}
    }
    return { id: jobId, status: 'completed' };
  }
}
