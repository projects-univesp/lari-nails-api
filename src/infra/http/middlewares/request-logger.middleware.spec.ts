/* eslint-disable @typescript-eslint/unbound-method */
import { Request, Response, NextFunction } from 'express';
import { RequestLoggerMiddleware } from './request-logger.middleware';

describe('RequestLoggerMiddleware', () => {
  let middleware: RequestLoggerMiddleware;

  beforeEach(() => {
    middleware = new RequestLoggerMiddleware();
  });

  it('deve chamar next e registrar listener para o evento finish', () => {
    const req = {
      method: 'GET',
      originalUrl: '/clients',
      correlationId: 'test-uuid',
    } as unknown as Request;

    let finishCallback: () => void = () => {};
    const res = {
      statusCode: 200,
      on: jest.fn((event: string, cb: () => void) => {
        if (event === 'finish') {
          finishCallback = cb;
        }
      }),
    } as unknown as Response;

    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));

    // Simula finalizacao da resposta
    expect(() => finishCallback()).not.toThrow();
  });
});
