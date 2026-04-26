import { tenantStorage, getTenantContext } from './tenant-context';

describe('TenantContext', () => {
  describe('getTenantContext', () => {
    it('should return null values when no context is set', () => {
      const ctx = getTenantContext();
      expect(ctx).toEqual({ tenantId: null, role: null });
    });

    it('should return stored context within AsyncLocalStorage run', (done) => {
      tenantStorage.run({ tenantId: 'tenant-1', role: 'DOCTOR' }, () => {
        const ctx = getTenantContext();
        expect(ctx.tenantId).toBe('tenant-1');
        expect(ctx.role).toBe('DOCTOR');
        done();
      });
    });

    it('should isolate context between concurrent runs', (done) => {
      let completed = 0;
      const finish = () => {
        completed++;
        if (completed === 2) done();
      };

      tenantStorage.run({ tenantId: 'tenant-a', role: 'DOCTOR' }, () => {
        setTimeout(() => {
          expect(getTenantContext().tenantId).toBe('tenant-a');
          finish();
        }, 10);
      });

      tenantStorage.run({ tenantId: 'tenant-b', role: 'PHARMACY' }, () => {
        setTimeout(() => {
          expect(getTenantContext().tenantId).toBe('tenant-b');
          finish();
        }, 10);
      });
    });
  });
});
