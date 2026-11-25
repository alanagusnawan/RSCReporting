import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { PrintAgentGateway } from './modules/printers/print-agent.gateway';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Attach PrintAgentGateway WebSocket server to NestJS HTTP server instance
  const httpServer = app.getHttpServer();
  const printGateway = app.get(PrintAgentGateway);
  printGateway.init(httpServer);

  const port = process.env.PORT || 5488;
  await app.listen(port, '0.0.0.0');
  logger.log(`Reporting Engine API running on port ${port}`);
  logger.log(`Print Agent WebSocket server listening at ws://localhost:${port}/agent/ws`);
}

bootstrap();
