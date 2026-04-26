import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    healthController = module.get<HealthController>(HealthController);
  });

  describe('GET /health', () => {
    it('should return { status: "ok" } with HTTP 200', () => {
      const result = healthController.getHealth();
      expect(result).toEqual({ status: 'ok' });
    });
  });
});
