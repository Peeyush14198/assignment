import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';

import type { RequestWithContext } from '../interfaces/request-with-context.interface';

@Injectable()
export class StructuredLoggerMiddleware implements NestMiddleware {
  use(req: RequestWithContext, res: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const elapsedNs = process.hrtime.bigint() - startedAt;
      const durationMs = Number(elapsedNs) / 1_000_000;

      const logPayload = {
        timestamp: new Date().toISOString(),
        level: 'info',
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
        userAgent: req.get('user-agent') ?? 'unknown'
      };

      process.stdout.write(`${JSON.stringify(logPayload)}\n`);
    });

    next();
  }
}
