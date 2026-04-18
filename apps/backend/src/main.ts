import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseEnvelopeInterceptor } from './common/response-envelope.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    credentials: true,
    allowedHeaders: ['content-type', 'x-request-id', 'authorization'],
    exposedHeaders: ['x-request-id'],
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  logger.log(`Backend listening on http://localhost:${port}`);
  logger.log(`CORS origins: ${origins.join(', ')}`);
}
bootstrap();
