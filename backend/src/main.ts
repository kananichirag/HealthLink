import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Raw body middleware for Stripe webhook — MUST be before global JSON parser and ValidationPipe
  app.use('/payments/webhook', express.raw({ type: 'application/json' }));

  // Enable CORS for frontend communication
  app.enableCors({
    origin: [
      'http://localhost:3000', // Next.js frontend
      'http://127.0.0.1:3000', // Alternative localhost
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Bearer',
    ],
    credentials: true,
  });

  // Register global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Register global ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = configService.get<number>('port') || 3000;
  await app.listen(port);

  logger.log(`Application is running on port ${port}`);
}
bootstrap();
