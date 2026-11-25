import { Module } from '@nestjs/common';
import { PrismaService } from './common/prisma.service';
import { ObjectStorageService } from './modules/storage/object-storage.service';
import { PdfGenerationService } from './modules/pdf/pdf-generation.service';
import { PdfGenerationController } from './modules/pdf/pdf-generation.controller';
import { TemplatesController } from './modules/templates/templates.controller';
import { PrintersController, PrintJobsController } from './modules/printers/printers.controller';
import { PrintersService } from './modules/printers/printers.service';
import { PrintAgentGateway } from './modules/printers/print-agent.gateway';
import { FilesController } from './modules/files/files.controller';
import { DataSourcesController } from './modules/data-sources/data-sources.controller';
import { AiModule } from './modules/ai/ai.module';
import { CategoriesModule } from './modules/categories/categories.module';

@Module({
  imports: [AiModule, CategoriesModule],
  controllers: [
    PdfGenerationController,
    TemplatesController,
    PrintersController,
    PrintJobsController,
    FilesController,
    DataSourcesController,
  ],
  providers: [
    PrismaService,
    ObjectStorageService,
    PdfGenerationService,
    PrintersService,
    PrintAgentGateway,
  ],
  exports: [
    PrintersService,
    PrintAgentGateway,
  ],
})
export class AppModule {}
