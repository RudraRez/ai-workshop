import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable, map } from 'rxjs';
import type { Request, Response } from 'express';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const incoming = req.header('x-request-id');
    const requestId =
      incoming && /^[0-9a-f-]{8,}$/i.test(incoming) ? incoming : randomUUID();
    res.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: { requestId, timestamp: new Date().toISOString() },
      })),
    );
  }
}
