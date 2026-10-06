import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { createHash, timingSafeEqual } from 'crypto';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_AUTOMATION_KEY } from '../decorators/automation.decorator';

export const ACCESS_TOKEN_COOKIE = 'access_token';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: unknown;
    }
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const isAutomation = this.reflector.getAllAndOverride<boolean>(
      IS_AUTOMATION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isAutomation) {
      const configured = process.env.AUTOMATION_API_KEY;
      const supplied = request.header('x-automation-key');
      if (!configured || !supplied || configured.length < 32) {
        throw new UnauthorizedException('Credencial de automação inválida');
      }
      const expected = createHash('sha256').update(configured).digest();
      const actual = createHash('sha256').update(supplied).digest();
      if (!timingSafeEqual(expected, actual)) {
        throw new UnauthorizedException('Credencial de automação inválida');
      }
      request.user = { sub: 'automation:n8n', role: 'automation' };
      return true;
    }
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }

    try {
      const payload: unknown = await this.jwtService.verifyAsync(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private extractToken(request: Request): string | null {
    if (request.cookies && request.cookies[ACCESS_TOKEN_COOKIE]) {
      return request.cookies[ACCESS_TOKEN_COOKIE] as string;
    }

    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
