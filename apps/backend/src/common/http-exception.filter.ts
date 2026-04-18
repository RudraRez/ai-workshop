import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const requestId =
      (res.getHeader('x-request-id') as string | undefined) ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Something went wrong';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        message = payload;
      } else if (payload && typeof payload === 'object') {
        const p = payload as Record<string, unknown>;
        if (typeof p.code === 'string') code = p.code;
        if (typeof p.message === 'string') message = p.message;
        else if (Array.isArray(p.message))
          message = (p.message as string[]).join('; ');
        if (p.details && typeof p.details === 'object')
          details = p.details as Record<string, unknown>;
        if (!p.code && status === HttpStatus.BAD_REQUEST) code = 'VALIDATION_FAILED';
        if (!p.code && status === HttpStatus.NOT_FOUND) code = 'NOT_FOUND';
        if (!p.code && status === HttpStatus.UNAUTHORIZED) code = 'UNAUTHORIZED';
        if (!p.code && status === HttpStatus.FORBIDDEN) code = 'FORBIDDEN';
      }
    } else {
      this.logger.error(
        `Unhandled exception on ${req.method} ${req.url}: ${
          (exception as Error)?.message ?? String(exception)
        }`,
        (exception as Error)?.stack,
      );
    }

    res.status(status).json({
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
      meta: { requestId, timestamp: new Date().toISOString() },
    });
  }
}
