import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  getRoot(): object {
    return {
      status: 'ok',
      service: 'blockchain-hash-service',
      timestamp: new Date().toISOString()
    };
  }

  @Get('health')
  getHealth(): object {
    return {
      status: 'healthy',
      database: 'connected',
      service: 'blockchain-hash-service'
    };
  }
}