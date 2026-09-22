/* eslint-disable @typescript-eslint/unbound-method */
import { Request, Response, NextFunction } from 'express';
import {
  CorrelationIdMiddleware,
  CORRELATION_ID_HEADER,
} from './correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
  });

  it('deve reutilizar header x-correlation-id existente na requisicao', () => {
    const req = {
      headers: {
        [CORRELATION_ID_HEADER]: 'existing-correlation-id',
      },
    } as unknown as Request;

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(req.correlationId).toBe('existing-correlation-id');
    expect(res.setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_HEADER,
      'existing-correlation-id',
    );
    expect(next).toHaveBeenCalled();
  });

  it('deve gerar um novo UUID quando o header de correlacao nao for fornecido', () => {
    const req = {
      headers: {},
    } as unknown as Request;

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(req.correlationId).toBeDefined();
    expect(typeof req.correlationId).toBe('string');
    expect(res.setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_HEADER,
      req.correlationId,
    );
    expect(next).toHaveBeenCalled();
  });
});
