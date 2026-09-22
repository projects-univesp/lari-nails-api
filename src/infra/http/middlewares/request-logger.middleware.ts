import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = process.hrtime.bigint();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const elapsedMs = Number(endTime - startTime) / 1_000_000;
      const statusCode = res.statusCode;
      const correlationId = req.correlationId || 'N/A';

      const logMessage = `[${method}] ${originalUrl} - ${statusCode} - ${elapsedMs.toFixed(2)}ms - [Correlation-ID: ${correlationId}]`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
