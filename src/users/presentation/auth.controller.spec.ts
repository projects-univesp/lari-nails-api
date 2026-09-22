/* eslint-disable @typescript-eslint/unbound-method */
import { Response, Request } from 'express';
import { AuthController, ACCESS_TOKEN_COOKIE } from './auth.controller';
import { LoginUseCase } from '../application/login.usecase';
import { SetupStatusUseCase } from '../application/setup-status.usecase';
import { SetupUseCase } from '../application/setup.usecase';

describe('AuthController', () => {
  let controller: AuthController;
  let loginUseCase: jest.Mocked<LoginUseCase>;
  let setupStatusUseCase: jest.Mocked<SetupStatusUseCase>;
  let setupUseCase: jest.Mocked<SetupUseCase>;

  beforeEach(() => {
    loginUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<LoginUseCase>;

    setupStatusUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<SetupStatusUseCase>;

    setupUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<SetupUseCase>;

    controller = new AuthController(
      loginUseCase,
      setupStatusUseCase,
      setupUseCase,
    );
  });

  it('deve retornar o status de setup do sistema', async () => {
    setupStatusUseCase.execute.mockResolvedValue({ needsSetup: true });

    const result = await controller.setupStatus();

    expect(result).toEqual({ needsSetup: true });
    expect(setupStatusUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('deve executar o setup, gravar cookie HttpOnly e retornar informacoes do admin', async () => {
    setupUseCase.execute.mockResolvedValue({
      token: 'jwt-token-admin',
      user: {
        id: 'u-admin',
        nome: 'Admin',
        email: 'admin@larinails.com',
        role: 'admin',
      },
    });

    const res = {
      cookie: jest.fn(),
    } as unknown as Response;

    const result = await controller.setup(
      { nome: 'Admin', email: 'admin@larinails.com', senha: 'password123' },
      res,
    );

    expect(setupUseCase.execute).toHaveBeenCalledWith({
      nome: 'Admin',
      email: 'admin@larinails.com',
      senha: 'password123',
    });
    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      'jwt-token-admin',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      }),
    );
    expect(result).toEqual({
      message: 'Setup inicial concluído com sucesso',
      user: {
        id: 'u-admin',
        nome: 'Admin',
        email: 'admin@larinails.com',
        role: 'admin',
      },
    });
  });

  it('deve executar o login, gravar cookie HttpOnly e retornar informacoes do usuario', async () => {
    loginUseCase.execute.mockResolvedValue({
      token: 'jwt-token-xyz',
      user: {
        id: 'u-1',
        nome: 'Admin',
        email: 'admin@mail.com',
        role: 'admin',
      },
    });

    const res = {
      cookie: jest.fn(),
    } as unknown as Response;

    const result = await controller.login(
      { email: 'admin@mail.com', senha: 'password123' },
      res,
    );

    expect(loginUseCase.execute).toHaveBeenCalledWith(
      'admin@mail.com',
      'password123',
    );
    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      'jwt-token-xyz',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      }),
    );
    expect(result).toEqual({
      message: 'Login realizado com sucesso',
      user: {
        id: 'u-1',
        nome: 'Admin',
        email: 'admin@mail.com',
        role: 'admin',
      },
    });
  });

  it('deve executar o logout e limpar o cookie da sessao', () => {
    const res = {
      clearCookie: jest.fn(),
    } as unknown as Response;

    const result = controller.logout(res);

    expect(res.clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, {
      path: '/',
    });
    expect(result).toEqual({
      message: 'Sessão encerrada com sucesso',
    });
  });

  it('deve retornar informacoes do usuario autenticado no endpoint me', () => {
    const req = {
      user: { id: 'u-1', email: 'admin@mail.com' },
    } as unknown as Request;

    const result = controller.me(req);

    expect(result).toEqual({
      user: { id: 'u-1', email: 'admin@mail.com' },
    });
  });
});
