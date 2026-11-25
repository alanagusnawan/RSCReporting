import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { PrintAgentGateway } from './modules/printers/print-agent.gateway';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Support regex or array for CORS or allow all if wildcard
  const rawCors = process.env.CORS_ORIGINS;
  let corsOrigin: any = ['http://localhost:5499', 'http://localhost:3000'];
  if (rawCors === '*' || !rawCors) {
    // If not specified or wildcard, allow any origin in local/LAN setups
    corsOrigin = true;
  } else {
    corsOrigin = rawCors.split(',').map((o) => o.trim());
  }

  app.enableCors({
    origin: corsOrigin,
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
