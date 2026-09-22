import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: unknown): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('deve permitir acesso se a rota nao exigir papeis especificos', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('deve permitir acesso se o usuario possuir o papel exigido', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockContext({ role: 'admin' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('deve lancar ForbiddenException se o usuario nao possuir perfil identificado', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException(
        'Acesso negado: perfil de usuário não identificado',
      ),
    );
  });

  it('deve lancar ForbiddenException se o usuario possuir perfil diferente do exigido', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockContext({ role: 'colaborador' });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Acesso negado: permissão insuficiente'),
    );
  });
});
