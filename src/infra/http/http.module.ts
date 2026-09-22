import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CorrelationIdMiddleware } from './middlewares/correlation-id.middleware';
import { RequestLoggerMiddleware } from './middlewares/request-logger.middleware';

@Module({})
export class HttpModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggerMiddleware)
      .forRoutes('*');
  }
}
