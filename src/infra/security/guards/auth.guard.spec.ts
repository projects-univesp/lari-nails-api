/* eslint-disable @typescript-eslint/unbound-method */
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard, ACCESS_TOKEN_COOKIE } from './auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_AUTOMATION_KEY } from '../decorators/automation.decorator';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    reflector = new Reflector();
    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    guard = new AuthGuard(reflector, jwtService);
  });

  it('aceita apenas a chave própria nas rotas de automação', async () => {
    const key = 'a'.repeat(40);
    process.env.AUTOMATION_API_KEY = key;
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((name) => name === IS_AUTOMATION_KEY);
    const request: {
      header: jest.Mock;
      cookies: Record<string, string>;
      headers: Record<string, string>;
      user?: unknown;
    } = {
      header: jest.fn().mockReturnValue(key),
      cookies: { access_token: 'human-token' },
      headers: {},
    };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    try {
      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(request.user).toEqual({
        sub: 'automation:n8n',
        role: 'automation',
      });
      request.header.mockReturnValue('incorrect-key');
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    } finally {
      delete process.env.AUTOMATION_API_KEY;
    }
  });

  it('deve permitir acesso quando a rota for marcada como @Public', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('deve lancar UnauthorizedException quando nenhum token for fornecido', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const request = {
      cookies: {},
      headers: {},
    };

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token de autenticação não fornecido'),
    );
  });

  it('deve autenticar e definir req.user quando token valido estiver nos cookies', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const payload = { sub: 'u-1', email: 'admin@mail.com', role: 'admin' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    const request: {
      cookies: Record<string, string>;
      headers: Record<string, string>;
      user?: unknown;
    } = {
      cookies: { [ACCESS_TOKEN_COOKIE]: 'valid-cookie-token' },
      headers: {},
    };

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-cookie-token');
    expect(request.user).toEqual(payload);
  });

  it('deve autenticar quando token valido estiver no header Authorization Bearer', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const payload = { sub: 'u-2', email: 'user@mail.com', role: 'user' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    const request: {
      cookies: Record<string, string>;
      headers: Record<string, string>;
      user?: unknown;
    } = {
      cookies: {},
      headers: { authorization: 'Bearer valid-header-token' },
    };

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-header-token');
    expect(request.user).toEqual(payload);
  });

  it('deve lancar UnauthorizedException quando a verificacao do token falhar', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    const request = {
      cookies: { [ACCESS_TOKEN_COOKIE]: 'invalid-token' },
      headers: {},
    };

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token inválido ou expirado'),
    );
  });
});
