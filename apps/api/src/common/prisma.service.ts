import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  async onModuleInit() {
    await this.verifyConnectionAndTables();
  }

  async verifyConnectionAndTables(): Promise<boolean> {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('PostgreSQL database connection established successfully.');

      // Check if required tables exist
      const tables: any[] = await this.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('Template', 'Report', 'PdfArtifact', 'PrintJob', 'FileRecord');
      `;

      const existingTableNames = tables.map((t: any) => t.table_name || t.TABLE_NAME);
      this.logger.log(`Detected PostgreSQL tables: [${existingTableNames.join(', ')}]`);

      const required = ['Template', 'Report', 'PdfArtifact', 'PrintJob'];
      const missing = required.filter(r => !existingTableNames.includes(r));

      if (missing.length > 0) {
        this.logger.warn(`Missing tables: [${missing.join(', ')}]. Run 'pnpm --filter @rsc/api prisma:push' or use automatic schema initialization.`);
      } else {
        this.logger.log('All core reporting engine tables are verified in PostgreSQL.');
      }
      return true;
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(`PostgreSQL (PG_PORT=${process.env.PG_PORT || 5435}) is currently unreachable: ${err.message}. Ensure your Docker Postgres container is running.`);
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }
}
