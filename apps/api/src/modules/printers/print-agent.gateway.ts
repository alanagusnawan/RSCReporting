import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { Socket } from 'net';
import { PrismaService } from '../../common/prisma.service';

export interface ConnectedAgent {
  agentId: string;
  hostname: string;
  displayName: string;
  printers: string[];
  version: string;
  os: string;
  ws: WebSocket;
  isAlive: boolean;
  connectedAt: Date;
  ips?: string[];
}

export interface HelloMessage {
  type: 'hello';
  agentId: string;
  hostname: string;
  displayName: string;
  printers: string[];
  version: string;
  os: string;
}

export interface JobResultMessage {
  type: 'job_result';
  jobId: string;
  success: boolean;
  durationMs?: number;
  error?: string;
  errorCode?: string;
}

export interface PrintersUpdateMessage {
  type: 'printers_update';
  printers: string[];
}

export interface PrinterDetailItem {
  name: string;
  isDefault?: boolean;
  status?: string;
  shared?: boolean;
  shareName?: string;
  protocol?: string;
  smbPath?: string;
  ippUri?: string;
  socketUri?: string;
  relayUri?: string;
}

export interface PrintersDetailMessage {
  type: 'printers_detail';
  agentId: string;
  hostname?: string;
  os?: string;
  ips?: string[];
  printers: PrinterDetailItem[];
}

@Injectable()
export class PrintAgentGateway implements OnModuleDestroy {
  private readonly logger = new Logger(PrintAgentGateway.name);
  private wss: WebSocketServer | null = null;
  private activeAgents = new Map<string, ConnectedAgent>();
  private pingInterval: NodeJS.Timeout | null = null;
  private optionsCache = new Map<string, { data: any; cachedAt: number }>();

  private pendingRequests = new Map<
    string,
    {
      resolve: (data: any) => void;
      reject: (err: any) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  constructor(private prisma: PrismaService) {}

  public init(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);

      // Only handle /agent/ws path
      if (url.pathname !== '/agent/ws') {
        return;
      }

      const authHeader = request.headers['authorization'];
      const token = authHeader?.replace(/^Bearer\s+/i, '');

      // 1. Verify Token
      if (!this.isValidToken(token)) {
        this.logger.warn(`Rejected WebSocket connection: Invalid or missing token from ${request.socket.remoteAddress}`);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      this.wss!.handleUpgrade(request, socket, head, (ws) => {
        this.wss!.emit('connection', ws, request);
      });
    });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    // Keepalive Ping every 30 seconds
    this.pingInterval = setInterval(() => {
      this.activeAgents.forEach((agent, agentId) => {
        if (!agent.isAlive) {
          this.logger.warn(`Agent ${agent.displayName} (${agentId}) missed heartbeat. Terminating socket.`);
          agent.ws.terminate();
          this.activeAgents.delete(agentId);
          if (this.prisma.isConnected) {
            this.prisma.printAgent
              .updateMany({
                where: { id: agentId },
                data: { status: 'offline', lastSeenAt: new Date() },
              })
              .catch(() => {});
          }
          return;
        }

        agent.isAlive = false;
        if (agent.ws.readyState === WebSocket.OPEN) {
          agent.ws.ping();
        }
      });
    }, 30000);

    this.logger.log('Print Agent WebSocket server attached to path /agent/ws');
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage) {
    let currentAgentId: string | null = null;
    let isHandshakeComplete = false;

    // Timeout handshake if 'hello' not received within 10s
    const handshakeTimeout = setTimeout(() => {
      if (!isHandshakeComplete) {
        this.logger.warn('Handshake timed out waiting for hello frame. Closing connection.');
        ws.close(4001, 'Handshake Timeout');
      }
    }, 10000);

    ws.on('pong', () => {
      if (currentAgentId && this.activeAgents.has(currentAgentId)) {
        this.activeAgents.get(currentAgentId)!.isAlive = true;
      }
    });

    ws.on('message', async (data: Buffer, isBinary: boolean) => {
      if (isBinary) {
        return; // Agent only sends JSON text frames to server
      }

      try {
        const text = data.toString('utf8');
        const msg = JSON.parse(text);

        switch (msg.type) {
          case 'hello': {
            clearTimeout(handshakeTimeout);
            const hello = msg as HelloMessage;

            if (!hello.agentId || typeof hello.agentId !== 'string') {
              this.logger.warn('Invalid agentId in hello frame. Closing with code 4002.');
              ws.close(4002, 'Invalid Agent ID');
              return;
            }

            currentAgentId = hello.agentId;
            isHandshakeComplete = true;

            const connId = `conn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

            this.activeAgents.set(currentAgentId, {
              agentId: hello.agentId,
              hostname: hello.hostname || 'unknown',
              displayName: hello.displayName || hello.hostname || 'Print Agent',
              printers: Array.isArray(hello.printers) ? hello.printers : [],
              version: hello.version || '1.0.0',
              os: hello.os || 'unknown',
              ws,
              isAlive: true,
              connectedAt: new Date(),
            });

            // Upsert agent info to PostgreSQL database
            if (this.prisma.isConnected) {
              try {
                await this.prisma.printAgent.upsert({
                  where: { id: hello.agentId },
                  create: {
                    id: hello.agentId,
                    name: hello.displayName || hello.hostname || 'Print Agent',
                    hostname: hello.hostname || null,
                    os: hello.os || null,
                    version: hello.version || null,
                    status: 'online',
                    wsConnectionId: connId,
                    printers: Array.isArray(hello.printers) ? hello.printers : [],
                    lastSeenAt: new Date(),
                  },
                  update: {
                    name: hello.displayName || hello.hostname || 'Print Agent',
                    hostname: hello.hostname || null,
                    os: hello.os || null,
                    version: hello.version || null,
                    status: 'online',
                    wsConnectionId: connId,
                    printers: Array.isArray(hello.printers) ? hello.printers : [],
                    lastSeenAt: new Date(),
                  },
                });
              } catch (dbErr: any) {
                this.logger.warn(`Could not sync PrintAgent ${hello.agentId} to DB: ${dbErr.message}`);
              }
            }

            // Respond with Frame 2: welcome frame
            const welcomePayload = {
              type: 'welcome',
              serverTime: new Date().toISOString(),
              connectionId: connId,
            };
            ws.send(JSON.stringify(welcomePayload));

            this.logger.log(
              `Agent ONLINE: "${hello.displayName}" (${hello.agentId}) on ${hello.hostname} [OS: ${hello.os}] - Printers: [${(hello.printers || []).join(', ')}]`,
            );
            break;
          }

          case 'printers_detail': {
            const detailMsg = msg as PrintersDetailMessage;
            const agentId = detailMsg.agentId || currentAgentId;
            if (!agentId) break;

            this.logger.log(`Received printers_detail for agent ${agentId} (${detailMsg.printers?.length || 0} printers)`);

            if (currentAgentId && this.activeAgents.has(currentAgentId)) {
              const agent = this.activeAgents.get(currentAgentId)!;
              if (detailMsg.ips && Array.isArray(detailMsg.ips)) {
                agent.ips = detailMsg.ips;
              }
            }

            if (this.prisma.isConnected) {
              try {
                // Update agent IPs & hostname if present
                await this.prisma.printAgent.updateMany({
                  where: { id: agentId },
                  data: {
                    hostname: detailMsg.hostname || undefined,
                    os: detailMsg.os || undefined,
                    ips: detailMsg.ips || undefined,
                    lastSeenAt: new Date(),
                  },
                });

                // Upsert each printer detail
                if (Array.isArray(detailMsg.printers)) {
                  for (const p of detailMsg.printers) {
                    const existing = await this.prisma.agentPrinter.findUnique({
                      where: {
                        agentId_name: {
                          agentId,
                          name: p.name,
                        },
                      },
                    });

                    // Cek auto-repoint jika endpoint smbPath / ippUri / relayUri berubah
                    if (existing) {
                      const endpointChanged =
                        (p.smbPath && p.smbPath !== existing.smbPath) ||
                        (p.ippUri && p.ippUri !== existing.ippUri) ||
                        (p.relayUri && p.relayUri !== existing.relayUri);

                      if (endpointChanged) {
                        this.triggerAutoRepoint(agentId, p);
                      }
                    }

                    await this.prisma.agentPrinter.upsert({
                      where: {
                        agentId_name: {
                          agentId,
                          name: p.name,
                        },
                      },
                      create: {
                        agentId,
                        name: p.name,
                        isDefault: Boolean(p.isDefault),
                        status: p.status || 'ready',
                        shared: Boolean(p.shared),
                        shareName: p.shareName || null,
                        protocol: p.protocol || null,
                        smbPath: p.smbPath || null,
                        ippUri: p.ippUri || null,
                        socketUri: p.socketUri || null,
                        relayUri: p.relayUri || null,
                      },
                      update: {
                        isDefault: Boolean(p.isDefault),
                        status: p.status || 'ready',
                        shared: Boolean(p.shared),
                        shareName: p.shareName || null,
                        protocol: p.protocol || null,
                        smbPath: p.smbPath || null,
                        ippUri: p.ippUri || null,
                        socketUri: p.socketUri || null,
                        relayUri: p.relayUri || null,
                      },
                    });
                  }
                }
              } catch (dbErr: any) {
                this.logger.warn(`Could not sync printers_detail in DB for agent ${agentId}: ${dbErr.message}`);
              }
            }
            break;
          }

          case 'job_result': {
            const res = msg as JobResultMessage;
            this.logger.log(
              `Job Result received: Job ${res.jobId}, Success: ${res.success}, Duration: ${res.durationMs ?? 0}ms`,
            );

            if (!res.success) {
              this.logger.error(`Print job ${res.jobId} FAILED: ${res.errorCode} - ${res.error}`);
            }

            // Update PrintJob in PostgreSQL
            if (this.prisma.isConnected) {
              try {
                await this.prisma.printJob.updateMany({
                  where: { id: res.jobId },
                  data: {
                    status: res.success ? 'completed' : 'failed',
                    completedAt: new Date(),
                    errorCode: res.errorCode || (res.success ? null : 'PRINT_FAILED'),
                    adapterResponseMetadata: {
                      error: res.error,
                      durationMs: res.durationMs,
                      agentId: currentAgentId,
                    },
                  },
                });
              } catch (dbErr: any) {
                this.logger.warn(`Could not update job ${res.jobId} in DB: ${dbErr.message}`);
              }
            }
            break;
          }

          case 'printers_update': {
            const update = msg as PrintersUpdateMessage;
            if (currentAgentId && this.activeAgents.has(currentAgentId)) {
              const printers = Array.isArray(update.printers) ? update.printers : [];
              this.activeAgents.get(currentAgentId)!.printers = printers;
              this.logger.log(`Updated printers for agent ${currentAgentId}: [${printers.join(', ')}]`);
              if (this.prisma.isConnected) {
                this.prisma.printAgent
                  .updateMany({
                    where: { id: currentAgentId },
                    data: { printers, lastSeenAt: new Date() },
                  })
                  .catch(() => {});
              }
            }
            break;
          }

          // Handler seluruh balasan perintah ber-requestId
          case 'options_result':
          case 'register_printer_result':
          case 'update_printer_result':
          case 'delete_printer_result':
          case 'set_default_result':
          case 'sync_printers_result':
          case 'share_printer_result':
          case 'unshare_printer_result': {
            const reqId = msg.requestId;
            if (reqId && this.pendingRequests.has(reqId)) {
              const pending = this.pendingRequests.get(reqId)!;
              clearTimeout(pending.timeout);
              this.pendingRequests.delete(reqId);

              if (msg.type === 'options_result' && msg.success && currentAgentId) {
                this.optionsCache.set(currentAgentId, {
                  data: msg.options,
                  cachedAt: Date.now(),
                });
              }

              if (msg.success) {
                pending.resolve(msg);
              } else {
                pending.reject(new Error(msg.error || `Command ${msg.type} failed on agent`));
              }
            }
            break;
          }

          default:
            this.logger.debug(`Unknown frame type from agent: ${(msg as any).type}`);
        }
      } catch (err: any) {
        this.logger.error(`Failed to parse frame JSON: ${err.message}`);
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      clearTimeout(handshakeTimeout);
      if (currentAgentId) {
        this.activeAgents.delete(currentAgentId);
        this.logger.log(`Agent OFFLINE: ${currentAgentId} (Code: ${code}, Reason: ${reason.toString() || 'None'})`);
        if (this.prisma.isConnected) {
          this.prisma.printAgent
            .updateMany({
              where: { id: currentAgentId },
              data: { status: 'offline', lastSeenAt: new Date() },
            })
            .catch(() => {});
        }
      }
    });

    ws.on('error', (err) => {
      this.logger.error(`WebSocket error on agent connection: ${err.message}`);
    });
  }

  public getActiveAgents(): ConnectedAgent[] {
    return Array.from(this.activeAgents.values());
  }

  public getAgent(agentId: string): ConnectedAgent | undefined {
    return this.activeAgents.get(agentId);
  }

  public findAgentForPrinter(printerName: string): ConnectedAgent | undefined {
    for (const agent of this.activeAgents.values()) {
      if (agent.printers.some((p) => p.toLowerCase() === printerName.toLowerCase())) {
        return agent;
      }
    }
    return undefined;
  }

  public isValidToken(token?: string): boolean {
    const configuredToken = process.env.PRINT_AGENT_TOKEN;
    if (configuredToken) {
      return token === configuredToken;
    }
    // Fallback: accept token with length > 5 in development
    return Boolean(token && token.length > 5);
  }

  /**
   * Generic Command Dispatcher via WebSocket dengan requestId dan promise matching
   */
  public async sendAgentCommand(
    agentId: string,
    messageType: string,
    payload: Record<string, any> = {},
    timeoutMs = 25000,
  ): Promise<any> {
    const agent = this.activeAgents.get(agentId);
    if (!agent || agent.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Agent ${agentId} is offline or not connected via WebSocket.`);
    }

    const requestId = `req-${messageType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const msg = {
      type: messageType,
      requestId,
      ...payload,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Timed out (${timeoutMs}ms) waiting for ${messageType} response from agent ${agent.displayName}`));
      }, timeoutMs);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });
      agent.ws.send(JSON.stringify(msg));
    });
  }

  public async requestAgentOptions(agentId: string, timeoutMs = 25000): Promise<any> {
    const cached = this.optionsCache.get(agentId);
    if (cached && Date.now() - cached.cachedAt < 5 * 60 * 1000) {
      return cached.data;
    }
    const res = await this.sendAgentCommand(agentId, 'get_options', {}, timeoutMs);
    return res.options;
  }

  public async requestRegisterPrinter(
    agentId: string,
    params: {
      name: string;
      driverName?: string;
      printerType: string;
      portOrUri: string;
      ppd?: string;
      driverless?: boolean;
      isDefault?: boolean;
    },
    timeoutMs = 25000,
  ): Promise<{ success: boolean; printer?: string }> {
    return this.sendAgentCommand(agentId, 'register_printer', params, timeoutMs);
  }

  public async requestUpdatePrinter(
    agentId: string,
    params: {
      printer: string;
      portOrUri?: string;
      isDefault?: boolean;
    },
    timeoutMs = 25000,
  ): Promise<{ success: boolean; printer?: string }> {
    return this.sendAgentCommand(agentId, 'update_printer', params, timeoutMs);
  }

  public async requestSetDefaultPrinter(
    agentId: string,
    printerName: string,
    timeoutMs = 15000,
  ): Promise<{ success: boolean; printer?: string }> {
    return this.sendAgentCommand(agentId, 'set_default_printer', { printer: printerName }, timeoutMs);
  }

  public async requestDeletePrinter(
    agentId: string,
    printerName: string,
    timeoutMs = 15000,
  ): Promise<{ success: boolean; printer?: string }> {
    return this.sendAgentCommand(agentId, 'delete_printer', { printer: printerName }, timeoutMs);
  }

  public async requestSharePrinter(
    agentId: string,
    params: {
      printer: string;
      protocol?: string;
      shareName?: string;
    },
    timeoutMs = 25000,
  ): Promise<any> {
    return this.sendAgentCommand(agentId, 'share_printer', params, timeoutMs);
  }

  public async requestUnsharePrinter(
    agentId: string,
    printerName: string,
    timeoutMs = 15000,
  ): Promise<any> {
    return this.sendAgentCommand(agentId, 'unshare_printer', { printer: printerName }, timeoutMs);
  }

  public async requestSyncPrinters(
    agentId: string,
    printers: any[],
    prune = false,
    timeoutMs = 30000,
  ): Promise<any> {
    return this.sendAgentCommand(agentId, 'sync_printers', { printers, prune }, timeoutMs);
  }

  /**
   * Auto-repoint saat IP / endpoint printer sumber berubah
   */
  private async triggerAutoRepoint(sourceAgentId: string, printer: PrinterDetailItem) {
    if (!this.prisma.isConnected) return;
    try {
      const activeShares = await this.prisma.printerShare.findMany({
        where: {
          sourceAgentId,
          sourcePrinterName: printer.name,
          status: 'installed',
        },
      });

      for (const share of activeShares) {
        const targetAgent = this.activeAgents.get(share.targetAgentId);
        if (!targetAgent) continue;

        // Tentukan endpoint baru sesuai OS target
        const newEndpoint =
          targetAgent.os === 'windows' && printer.smbPath
            ? printer.smbPath
            : printer.relayUri || printer.ippUri || share.endpointUsed;

        if (newEndpoint !== share.endpointUsed) {
          this.logger.log(
            `Auto-repointing printer "${share.targetQueueName}" on agent ${share.targetAgentId} to new endpoint ${newEndpoint}`,
          );

          try {
            await this.requestUpdatePrinter(share.targetAgentId, {
              printer: share.targetQueueName,
              portOrUri: newEndpoint,
              isDefault: share.isDefault,
            });

            await this.prisma.printerShare.update({
              where: { id: share.id },
              data: { endpointUsed: newEndpoint },
            });

            await this.prisma.printerAuditLog.create({
              data: {
                action: 'REPOINT',
                sourceAgentId,
                targetAgentId: share.targetAgentId,
                printerName: share.targetQueueName,
                detail: {
                  oldEndpoint: share.endpointUsed,
                  newEndpoint,
                  reason: 'DHCP / IP Change Detected',
                },
              },
            });
          } catch (repointErr: any) {
            this.logger.error(`Failed auto-repoint on agent ${share.targetAgentId}: ${repointErr.message}`);
          }
        }
      }
    } catch (e: any) {
      this.logger.warn(`Error during triggerAutoRepoint: ${e.message}`);
    }
  }

  onModuleDestroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.wss) {
      this.wss.close();
    }
  }
}
