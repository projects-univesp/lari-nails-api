import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { throttlerConfig } from './rate-limit/throttler.config';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot(throttlerConfig),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'lari-nails-secret-key-123456789',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [ThrottlerModule, JwtModule],
})
export class SecurityModule {}
