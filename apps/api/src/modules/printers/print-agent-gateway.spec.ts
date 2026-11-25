import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import { PrintAgentGateway } from './print-agent.gateway';
import { PrintersService } from './printers.service';
import { PrismaService } from '../../common/prisma.service';

describe('Go Print Agent WebSocket Protocol Integration Tests', () => {
  let server: http.Server;
  let gateway: PrintAgentGateway;
  let printersService: PrintersService;
  let prismaMock: any;
  const testPort = 5988;
  const validToken = 'secret-print-token-12345';

  beforeAll(async () => {
    process.env.PRINT_AGENT_TOKEN = validToken;
    prismaMock = {
      isConnected: false,
      printJob: {
        create: vi.fn().mockResolvedValue({ id: 'job-1' }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    gateway = new PrintAgentGateway(prismaMock as any);
    printersService = new PrintersService(gateway, prismaMock as any);

    server = http.createServer();
    gateway.init(server);

    await new Promise<void>((resolve) => {
      server.listen(testPort, () => resolve());
    });
  });

  afterAll(async () => {
    gateway.onModuleDestroy();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('rejects connection with 401 when token is invalid or missing', async () => {
    const ws = new WebSocket(`ws://localhost:${testPort}/agent/ws`, {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    const errorPromise = new Promise<{ code?: number; message?: string }>((resolve) => {
      ws.on('error', (err: any) => resolve({ message: err.message }));
      ws.on('unexpected-response', (req, res) => resolve({ code: res.statusCode }));
    });

    const result = await errorPromise;
    expect(result.code).toBe(401);
  });

  it('successfully completes handshake: Agent sends hello -> Server replies welcome', async () => {
    const ws = new WebSocket(`ws://localhost:${testPort}/agent/ws`, {
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    await new Promise<void>((resolve) => ws.on('open', () => resolve()));

    // Agent sends Frame hello
    const helloFrame = {
      type: 'hello',
      agentId: '550e8400-e29b-41d4-a716-446655440000',
      hostname: 'komputer-kasir-1',
      displayName: 'Kasir Utama Depan',
      printers: ['HP-LaserJet-Pro', 'Epson-TM-T82X'],
      version: '1.0.0',
      os: 'windows',
    };
    ws.send(JSON.stringify(helloFrame));

    // Await Server response: Frame welcome
    const welcomePromise = new Promise<any>((resolve) => {
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        resolve(msg);
      });
    });

    const welcomeMsg = await welcomePromise;
    expect(welcomeMsg.type).toBe('welcome');
    expect(welcomeMsg.serverTime).toBeDefined();
    expect(welcomeMsg.connectionId).toBeDefined();

    // Verify agent is in active memory map
    const onlinePrinters = printersService.getOnlinePrinters();
    expect(onlinePrinters.some((p) => p.id === 'HP-LaserJet-Pro')).toBe(true);
    expect(onlinePrinters.some((p) => p.id === 'Epson-TM-T82X')).toBe(true);

    ws.close(1000);
  });

  it('dispatches print job in 2 consecutive frames: Frame 1 JSON + Frame 2 binary PDF', async () => {
    const ws = new WebSocket(`ws://localhost:${testPort}/agent/ws`, {
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    await new Promise<void>((resolve) => ws.on('open', () => resolve()));

    // Handshake
    ws.send(
      JSON.stringify({
        type: 'hello',
        agentId: 'agent-printer-device-01',
        hostname: 'kasir-laptop',
        displayName: 'POS Cashier 1',
        printers: ['POS-Thermal-80mm'],
        version: '1.0.0',
        os: 'linux',
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    const receivedFrames: any[] = [];
    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        receivedFrames.push({ type: 'binary', buffer: data });
      } else {
        receivedFrames.push(JSON.parse(data.toString()));
      }
    });

    // Server dispatches job
    const fakePdfBytes = Buffer.from('%PDF-1.4 Fake PDF Data Stream');
    const dispatchResult = await printersService.dispatchPrintJob({
      printerName: 'POS-Thermal-80mm',
      pdfBuffer: fakePdfBytes,
      fileName: 'struk-001.pdf',
      copies: 1,
    });

    expect(dispatchResult.status).toBe('accepted');

    // Wait briefly for socket delivery
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check Frame 1 and Frame 2
    // receivedFrames[0] is 'welcome'
    const jobMetadata = receivedFrames.find((f) => f.type === 'job');
    expect(jobMetadata).toBeDefined();
    expect(jobMetadata.printer).toBe('POS-Thermal-80mm');
    expect(jobMetadata.fileName).toBe('struk-001.pdf');
    expect(jobMetadata.fileSize).toBe(fakePdfBytes.length);

    const binaryFrame = receivedFrames.find((f) => f.type === 'binary');
    expect(binaryFrame).toBeDefined();
    expect(Buffer.from(binaryFrame.buffer).toString()).toContain('%PDF-1.4');

    // Agent reports job_result back to server
    ws.send(
      JSON.stringify({
        type: 'job_result',
        jobId: jobMetadata.jobId,
        success: true,
        durationMs: 420,
      }),
    );

    ws.close(1000);
  });
});
