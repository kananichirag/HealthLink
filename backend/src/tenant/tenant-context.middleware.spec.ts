import { TenantContextMiddleware } from './tenant-context.middleware';
import { getTenantContext } from './tenant-context';
import { Request, Response } from 'express';

describe('TenantContextMiddleware', () => {
  let middleware: TenantContextMiddleware;

  beforeEach(() => {
    middleware = new TenantContextMiddleware();
  });

  it('should store tenantId and role from req.user in AsyncLocalStorage', (done) => {
    const req = {
      user: { sub: 'user-1', email: 'doc@test.com', role: 'DOCTOR', tenantId: 'tenant-123' },
    } as any;
    const res = {} as Response;

    middleware.use(req, res, () => {
      const ctx = getTenantContext();
      expect(ctx.tenantId).toBe('tenant-123');
      expect(ctx.role).toBe('DOCTOR');
      done();
    });
  });

  it('should set null values when req.user is undefined', (done) => {
    const req = {} as Request;
    const res = {} as Response;

    middleware.use(req, res, () => {
      const ctx = getTenantContext();
      expect(ctx.tenantId).toBeNull();
      expect(ctx.role).toBeNull();
      done();
    });
  });

  it('should set null tenantId when user has no tenantId', (done) => {
    const req = {
      user: { sub: 'user-1', email: 'admin@test.com', role: 'ADMIN' },
    } as any;
    const res = {} as Response;

    middleware.use(req, res, () => {
      const ctx = getTenantContext();
      expect(ctx.tenantId).toBeNull();
      expect(ctx.role).toBe('ADMIN');
      done();
    });
  });
});
