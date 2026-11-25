import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrintAgentGateway, ConnectedAgent } from './print-agent.gateway';
import { PrismaService } from '../../common/prisma.service';
import { WebSocket } from 'ws';
import * as crypto from 'crypto';

export interface DispatchJobInput {
  jobId?: string;
  artifactId?: string;
  agentId?: string;
  printerName: string;
  pdfBuffer: Buffer;
  fileName?: string;
  paper?: string;
  orientation?: 'portrait' | 'landscape';
  copies?: number;
  duplex?: boolean;
  color?: boolean;
  scale?: 'fit' | 'actual' | 'shrink';
  idempotencyKey?: string;
}

export interface DispatchJobResult {
  jobId: string;
  printerId: string;
  status: 'accepted' | 'failed';
  agentId?: string;
  agentHostname?: string;
  message?: string;
}

@Injectable()
export class PrintersService {
  private readonly logger = new Logger(PrintersService.name);

  constructor(
    private gateway: PrintAgentGateway,
    private prisma: PrismaService,
  ) {}

  public getOnlinePrinters() {
    const agents = this.gateway.getActiveAgents();
    const printerList: Array<{
      id: string;
      name: string;
      model?: string;
      status: 'online' | 'offline';
      agentId?: string;
      hostname?: string;
      displayName?: string;
      os?: string;
    }> = [];

    // Aggregate printers across all online agents
    for (const agent of agents) {
      for (const printer of agent.printers) {
        printerList.push({
          id: printer,
          name: `${printer} (${agent.displayName})`,
          model: agent.os,
          status: 'online',
          agentId: agent.agentId,
          hostname: agent.hostname,
          displayName: agent.displayName,
          os: agent.os,
        });
      }
    }

    // Default fallback printers if no Go Agent is connected yet
    if (printerList.length === 0) {
      return [
        { id: 'Epson-TM-T82X', name: 'Epson-TM-T82X (POS Thermal Receipt)', model: 'ESC/POS Thermal', status: 'offline' },
        { id: 'HP-LaserJet-Pro', name: 'HP-LaserJet-Pro (Office Laser)', model: 'PCL6 / PDF', status: 'offline' },
      ];
    }

    return printerList;
  }

  public async getRegisteredAgents() {
    // Read from DB first
    let dbAgents: any[] = [];
    if (this.prisma.isConnected) {
      try {
        dbAgents = await this.prisma.printAgent.findMany({
          orderBy: { updatedAt: 'desc' },
        });
      } catch (err: any) {
        this.logger.warn(`Could not read print agents from DB: ${err.message}`);
      }
    }

    const activeMap = new Map(
      this.gateway.getActiveAgents().map((a) => [a.agentId, a]),
    );

    // Merge DB records with current memory online status
    const result = dbAgents.map((agent) => {
      const active = activeMap.get(agent.id);
      return {
        agentId: agent.id,
        name: agent.name,
        displayName: agent.name,
        hostname: agent.hostname,
        os: agent.os,
        version: agent.version,
        status: active ? 'online' : agent.status,
        printers: active ? active.printers : agent.printers,
        lastSeenAt: agent.lastSeenAt,
      };
    });

    // Add any active agents not yet in DB
    for (const [id, active] of activeMap.entries()) {
      if (!result.some((r) => r.agentId === id)) {
        result.push({
          agentId: active.agentId,
          name: active.displayName,
          displayName: active.displayName,
          hostname: active.hostname,
          os: active.os,
          version: active.version,
          status: 'online',
          printers: active.printers,
          lastSeenAt: new Date(),
        });
      }
    }

    return result;
  }

  public async updateAgent(agentId: string, data: { name?: string }) {
    if (!this.prisma.isConnected) {
      throw new BadRequestException('Database connection is not available');
    }
    const updated = await this.prisma.printAgent.update({
      where: { id: agentId },
      data: {
        ...(data.name ? { name: data.name } : {}),
      },
    });

    // Sync in memory if connected
    const active = this.gateway.getAgent(agentId);
    if (active && data.name) {
      active.displayName = data.name;
    }

    return updated;
  }

  public async deleteAgent(agentId: string) {
    if (!this.prisma.isConnected) {
      throw new BadRequestException('Database connection is not available');
    }
    return this.prisma.printAgent.delete({
      where: { id: agentId },
    });
  }

  public async getAgentOptions(agentId: string) {
    return this.gateway.requestAgentOptions(agentId);
  }

  public async registerPrinter(params: {
    agentId: string;
    name: string;
    driverName?: string;
    printerType: string;
    portOrUri: string;
    isDefault?: boolean;
  }) {
    const { agentId, ...printerParams } = params;
    return this.gateway.requestRegisterPrinter(agentId, printerParams);
  }

  public async getAgentPrintersDetail(agentId: string) {
    if (!this.prisma.isConnected) {
      return [];
    }
    return this.prisma.agentPrinter.findMany({
      where: { agentId },
      orderBy: { name: 'asc' },
    });
  }

  public async sharePrinter(agentId: string, printerName: string, protocol = 'auto', shareName?: string) {
    const res = await this.gateway.requestSharePrinter(agentId, {
      printer: printerName,
      protocol,
      shareName: shareName || `RSC-${printerName.replace(/\s+/g, '-')}`,
    });

    if (this.prisma.isConnected) {
      await this.prisma.printerAuditLog.create({
        data: {
          action: 'SHARE',
          sourceAgentId: agentId,
          printerName,
          detail: res,
        },
      });

      // Update local record if success
      if (res.success) {
        await this.prisma.agentPrinter.updateMany({
          where: { agentId, name: printerName },
          data: {
            shared: true,
            shareName: res.shareName || undefined,
            protocol: res.protocol || undefined,
            smbPath: res.smbPath || undefined,
            ippUri: res.ippUri || undefined,
            relayUri: res.relayUri || undefined,
          },
        });
      }
    }

    return res;
  }

  public async unsharePrinter(agentId: string, printerName: string) {
    const res = await this.gateway.requestUnsharePrinter(agentId, printerName);

    if (this.prisma.isConnected) {
      await this.prisma.printerAuditLog.create({
        data: {
          action: 'UNSHARE',
          sourceAgentId: agentId,
          printerName,
          detail: res,
        },
      });

      if (res.success) {
        await this.prisma.agentPrinter.updateMany({
          where: { agentId, name: printerName },
          data: { shared: false },
        });
      }
    }

    return res;
  }

  public async installToAgents(params: {
    sourceAgentId: string;
    sourcePrinterName: string;
    targetAgentIds: string[];
    targetQueueName?: string;
    isDefault?: boolean;
    actorUserId?: string;
  }) {
    const { sourceAgentId, sourcePrinterName, targetAgentIds, isDefault, actorUserId } = params;

    // 1. Get Source Agent & Source Printer Details
    const sourceAgent = this.gateway.getAgent(sourceAgentId);
    let printerDetail: any = null;

    if (this.prisma.isConnected) {
      printerDetail = await this.prisma.agentPrinter.findUnique({
        where: {
          agentId_name: {
            agentId: sourceAgentId,
            name: sourcePrinterName,
          },
        },
      });
    }

    const queueName = params.targetQueueName || `${sourceAgent?.displayName || 'Remote'}-${sourcePrinterName}`;
    const results: Array<{ targetAgentId: string; success: boolean; error?: string; endpointUsed?: string }> = [];

    for (const targetId of targetAgentIds) {
      const targetAgent = this.gateway.getAgent(targetId);
      if (!targetAgent) {
        results.push({ targetAgentId: targetId, success: false, error: 'Target agent is offline' });
        continue;
      }

      // Rule Engine pemilihan endpoint A -> B
      const sourceOS = (sourceAgent?.os || 'windows').toLowerCase();
      const targetOS = (targetAgent?.os || 'windows').toLowerCase();

      let portOrUri = '';
      let printerType = 'HTTP_SHARED';
      let driverName = 'Generic / Text Only';

      if (sourceOS === 'windows' && targetOS === 'windows') {
        portOrUri = printerDetail?.smbPath || `\\\\${sourceAgent?.hostname}\\${printerDetail?.shareName || sourcePrinterName}`;
        driverName = 'Generic / Text Only';
      } else if (sourceOS !== 'windows' && targetOS !== 'windows') {
        portOrUri = printerDetail?.ippUri || `ipp://${sourceAgent?.hostname}.local:631/printers/${sourcePrinterName}`;
        driverName = ''; // driverless
      } else {
        // Cross-OS (misal Mac -> Windows atau sebaliknya)
        // Jika target adalah Windows dan source menyediakan socketUri (Relay RAW port 19101+),
        // utamakan RAW socket TCP karena jauh lebih stabil di Windows (tanpa error IPP/WSD 0x80070bc4).
        const sourceIps = (sourceAgent as any)?.ips || (printerDetail as any)?.ips || [];
        const validIp = Array.isArray(sourceIps) ? sourceIps.find((ip: string) => ip && ip !== '127.0.0.1' && !ip.startsWith('169.254')) : null;

        if (targetOS === 'windows' && printerDetail?.socketUri) {
          let sUri = printerDetail.socketUri;
          if (validIp && (sUri.includes('.local') || !sUri.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/))) {
            sUri = sUri.replace(/:\/\/[^:/]+(:[0-9]+)?/, `://${validIp}$1`);
          }
          portOrUri = sUri;
          printerType = 'NETWORK';
          driverName = 'Generic / Text Only';
        } else {
          // Gunakan relayUri atau ippUri, utamakan IP jika ada agar Windows bisa resolve tanpa mDNS .local
          let rawUri = printerDetail?.relayUri || printerDetail?.ippUri;
          if (!rawUri) {
            rawUri = `http://${sourceAgent?.hostname}:19100/printers/${sourcePrinterName}`;
          }

          // Jika target adalah Windows, ubah skema ipp:// jadi http:// untuk spooler Windows
          if (targetOS === 'windows' && rawUri.startsWith('ipp://')) {
            rawUri = 'http://' + rawUri.slice(6);
          }

          if (validIp && rawUri.includes('.local')) {
            rawUri = rawUri.replace(/:\/\/[^:/]+(:[0-9]+)?/, `://${validIp}$1`);
          }

          portOrUri = rawUri;
          driverName = targetOS === 'windows' ? 'Microsoft IPP Class Driver' : '';
        }
      }

      try {
        const installRes = await this.gateway.requestRegisterPrinter(targetId, {
          name: queueName,
          printerType,
          portOrUri,
          driverName: driverName || undefined,
          driverless: !driverName,
          isDefault: Boolean(isDefault),
        });

        if (this.prisma.isConnected) {
          await this.prisma.printerShare.upsert({
            where: {
              sourceAgentId_sourcePrinterName_targetAgentId: {
                sourceAgentId,
                sourcePrinterName,
                targetAgentId: targetId,
              },
            },
            create: {
              sourceAgentId,
              sourcePrinterName,
              targetAgentId: targetId,
              targetQueueName: queueName,
              printerType,
              endpointUsed: portOrUri,
              driverName: driverName || null,
              isDefault: Boolean(isDefault),
              status: 'installed',
            },
            update: {
              targetQueueName: queueName,
              printerType,
              endpointUsed: portOrUri,
              driverName: driverName || null,
              isDefault: Boolean(isDefault),
              status: 'installed',
              errorMessage: null,
            },
          });

          await this.prisma.printerAuditLog.create({
            data: {
              actorUserId: actorUserId || 'admin',
              action: 'INSTALL',
              sourceAgentId,
              targetAgentId: targetId,
              printerName: queueName,
              detail: {
                sourcePrinterName,
                portOrUri,
                driverName,
                isDefault,
              },
            },
          });
        }

        results.push({ targetAgentId: targetId, success: true, endpointUsed: portOrUri });
      } catch (err: any) {
        if (this.prisma.isConnected) {
          await this.prisma.printerShare.upsert({
            where: {
              sourceAgentId_sourcePrinterName_targetAgentId: {
                sourceAgentId,
                sourcePrinterName,
                targetAgentId: targetId,
              },
            },
            create: {
              sourceAgentId,
              sourcePrinterName,
              targetAgentId: targetId,
              targetQueueName: queueName,
              printerType,
              endpointUsed: portOrUri,
              driverName: driverName || null,
              isDefault: Boolean(isDefault),
              status: 'failed',
              errorMessage: err.message,
            },
            update: {
              status: 'failed',
              errorMessage: err.message,
            },
          });
        }
        results.push({ targetAgentId: targetId, success: false, error: err.message, endpointUsed: portOrUri });
      }
    }

    return {
      success: results.some((r) => r.success),
      results,
    };
  }

  public async getPrinterShares() {
    if (!this.prisma.isConnected) return [];
    return this.prisma.printerShare.findMany({
      include: {
        sourceAgent: { select: { id: true, name: true, hostname: true, os: true, status: true } },
        targetAgent: { select: { id: true, name: true, hostname: true, os: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async uninstallPrinterShare(shareId: string, actorUserId = 'admin') {
    if (!this.prisma.isConnected) throw new BadRequestException('Database offline');

    const share = await this.prisma.printerShare.findUnique({ where: { id: shareId } });
    if (!share) throw new NotFoundException('Printer share record not found');

    let agentUninstalled = false;
    let errorMsg = '';

    try {
      await this.gateway.requestDeletePrinter(share.targetAgentId, share.targetQueueName);
      agentUninstalled = true;
    } catch (e: any) {
      errorMsg = e.message;
      this.logger.warn(`Could not delete queue on agent ${share.targetAgentId}: ${e.message}`);
    }

    await this.prisma.printerShare.delete({ where: { id: shareId } });

    await this.prisma.printerAuditLog.create({
      data: {
        actorUserId,
        action: 'UNINSTALL',
        sourceAgentId: share.sourceAgentId,
        targetAgentId: share.targetAgentId,
        printerName: share.targetQueueName,
        detail: {
          endpointUsed: share.endpointUsed,
          agentDeleted: agentUninstalled,
          warning: errorMsg || undefined,
        },
      },
    });

    return { success: true, agentUninstalled, error: errorMsg || undefined };
  }

  public async getAuditLogs(take = 50) {
    if (!this.prisma.isConnected) return [];
    return this.prisma.printerAuditLog.findMany({
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  public async setDefaultPrinter(agentId: string, printerName: string) {
    return this.gateway.requestSetDefaultPrinter(agentId, printerName);
  }

  public async deletePrinter(agentId: string, printerName: string) {
    return this.gateway.requestDeletePrinter(agentId, printerName);
  }

  public getConnectedAgents() {
    return this.gateway.getActiveAgents().map((a) => ({
      agentId: a.agentId,
      hostname: a.hostname,
      displayName: a.displayName,
      printers: a.printers,
      version: a.version,
      os: a.os,
      connectedAt: a.connectedAt,
      isAlive: a.isAlive,
    }));
  }

  /**
   * Pushes a print job to the designated Go Print Agent using 2 sequential frames:
   * Frame 1: Text Frame (JSON Metadata)
   * Frame 2: Binary Frame (Raw PDF Bytes)
   */
  public async dispatchPrintJob(input: DispatchJobInput): Promise<DispatchJobResult> {
    const jobId = input.jobId || crypto.randomUUID();
    const printerName = input.printerName;

    // 1. Find target Go Agent
    let targetAgent: ConnectedAgent | undefined;
    if (input.agentId) {
      targetAgent = this.gateway.getAgent(input.agentId);
    }
    if (!targetAgent) {
      targetAgent = this.gateway.findAgentForPrinter(printerName);
    }

    // Fallback: If no direct match, check if any agent is online
    if (!targetAgent) {
      const allAgents = this.gateway.getActiveAgents();
      if (allAgents.length > 0) {
        targetAgent = allAgents[0]; // send to primary agent
        this.logger.warn(
          `Printer "${printerName}" not found on any specific agent. Routing to connected agent "${targetAgent.displayName}" (${targetAgent.agentId}).`,
        );
      }
    }

    if (!targetAgent || targetAgent.ws.readyState !== WebSocket.OPEN) {
      const errMsg = `No online Print Agent available to handle printer "${printerName}". Check if Go Print Agent is running.`;
      this.logger.warn(errMsg);

      // Record failed dispatch in database if artifact exists
      if (input.artifactId && this.prisma.isConnected) {
        try {
          await this.prisma.printJob.create({
            data: {
              id: jobId,
              artifactId: input.artifactId,
              printerId: printerName,
              agentId: input.agentId || undefined,
              adapterType: 'websocket-agent',
              status: 'failed',
              errorCode: 'AGENT_OFFLINE',
              adapterResponseMetadata: { error: errMsg },
            },
          });
        } catch {}
      }

      return {
        jobId,
        printerId: printerName,
        status: 'failed',
        message: errMsg,
      };
    }

    // 2. Persist initial pending/dispatching print job in PostgreSQL
    if (input.artifactId && this.prisma.isConnected) {
      try {
        await this.prisma.printJob.create({
          data: {
            id: jobId,
            artifactId: input.artifactId,
            printerId: printerName,
            agentId: targetAgent.agentId,
            adapterType: 'websocket-agent',
            status: 'dispatching',
            idempotencyKey: input.idempotencyKey || undefined,
            externalJobId: `ws-${targetAgent.agentId.slice(0, 8)}`,
            adapterResponseMetadata: {
              agentId: targetAgent.agentId,
              hostname: targetAgent.hostname,
            },
          },
        });
      } catch (err: any) {
        this.logger.warn(`Could not persist initial PrintJob: ${err.message}`);
      }
    }

    // 3. Prepare Frame 1: Text JSON Metadata Frame
    const metadata = {
      type: 'job',
      jobId,
      printer: printerName,
      template: {
        paper: input.paper || 'A4',
        orientation: input.orientation || 'portrait',
        copies: input.copies || 1,
        duplex: input.duplex || false,
        color: input.color || false,
        scale: input.scale || 'fit',
      },
      fileName: input.fileName || `doc-${jobId}.pdf`,
      fileSize: input.pdfBuffer.length,
      pdfEncoding: 'binary',
    };

    try {
      // Send Frame 1: Text Frame
      targetAgent.ws.send(JSON.stringify(metadata));

      // Send Frame 2: Binary Frame (Raw PDF Bytes immediately without pause)
      targetAgent.ws.send(input.pdfBuffer, { binary: true });

      this.logger.log(
        `Dispatched print job ${jobId} (size: ${input.pdfBuffer.length} bytes) to agent "${targetAgent.displayName}" for printer "${printerName}"`,
      );

      return {
        jobId,
        printerId: printerName,
        status: 'accepted',
        agentId: targetAgent.agentId,
        agentHostname: targetAgent.hostname,
        message: `Dispatched to Go Print Agent (${targetAgent.displayName}) via WebSocket`,
      };
    } catch (sendErr: any) {
      this.logger.error(`Failed to push WebSocket frames to agent: ${sendErr.message}`);

      if (this.prisma.isConnected) {
        try {
          await this.prisma.printJob.updateMany({
            where: { id: jobId },
            data: {
              status: 'failed',
              errorCode: 'DISPATCH_ERROR',
              adapterResponseMetadata: { error: sendErr.message },
            },
          });
        } catch {}
      }

      return {
        jobId,
        printerId: printerName,
        status: 'failed',
        message: `Socket error: ${sendErr.message}`,
      };
    }
  }
}
