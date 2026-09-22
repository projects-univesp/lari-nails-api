import { Controller, Post, Body, Res, Get, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { LoginUseCase } from '../application/login.usecase';
import { SetupStatusUseCase } from '../application/setup-status.usecase';
import { SetupUseCase } from '../application/setup.usecase';
import { LoginDto } from './dtos/login.dto';
import { SetupDto } from './dtos/setup.dto';
import { Public } from '../../infra/security/decorators/public.decorator';

export const ACCESS_TOKEN_COOKIE = 'access_token';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly setupStatusUseCase: SetupStatusUseCase,
    private readonly setupUseCase: SetupUseCase,
  ) {}

  @Public()
  @Get('setup-status')
  async setupStatus() {
    return this.setupStatusUseCase.execute();
  }

  @Public()
  @Post('setup')
  async setup(
    @Body() body: SetupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.setupUseCase.execute(body);

    res.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      message: 'Setup inicial concluído com sucesso',
      user,
    };
  }

  @Public()
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.loginUseCase.execute(
      body.email,
      body.senha,
    );

    res.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      message: 'Login realizado com sucesso',
      user,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    return {
      message: 'Sessão encerrada com sucesso',
    };
  }

  @Get('me')
  me(@Req() req: Request) {
    return {
      user: req.user ?? null,
    };
  }
}
