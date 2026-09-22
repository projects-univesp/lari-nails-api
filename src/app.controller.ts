import { Controller, Get } from '@nestjs/common';
import { Public } from './infra/security/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  checkHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      message: 'Healthy',
    };
  }
}
