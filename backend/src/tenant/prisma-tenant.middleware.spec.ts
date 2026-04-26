import {
  getActiveTenantId,
  isTenantScopedModel,
  injectTenantWhere,
  injectTenantData,
  TENANT_SCOPED_MODELS,
} from './prisma-tenant.middleware';
import { tenantStorage } from './tenant-context';

describe('PrismaTenantMiddleware', () => {
  function runWithContext<T>(
    tenantId: string | null,
    role: string | null,
    fn: () => T,
  ): T {
    return tenantStorage.run({ tenantId, role }, fn);
  }

  describe('getActiveTenantId', () => {
    it('should return tenantId for non-admin users', () => {
      const result = runWithContext('tenant-1', 'DOCTOR', () => getActiveTenantId());
      expect(result).toBe('tenant-1');
    });

    it('should return null for Admin role', () => {
      const result = runWithContext('tenant-1', 'ADMIN', () => getActiveTenantId());
      expect(result).toBeNull();
    });

    it('should return null when no context is set', () => {
      expect(getActiveTenantId()).toBeNull();
    });

    it('should return null when tenantId is null', () => {
      const result = runWithContext(null, 'DOCTOR', () => getActiveTenantId());
      expect(result).toBeNull();
    });
  });

  describe('isTenantScopedModel', () => {
    it('should return true for all tenant-scoped models', () => {
      const models = [
        'User', 'Patient', 'Medicine', 'Prescription', 'PrescriptionItem',
        'Sale', 'SaleItem', 'Order', 'Payment', 'Notification',
        'DoctorPharmacyConnection', 'AllergyReport', 'Appointment',
        'DoctorSchedule', 'BlockedDate', 'PurchaseRecord',
      ];
      for (const model of models) {
        expect(isTenantScopedModel(model)).toBe(true);
      }
    });

    it('should return false for Tenant model', () => {
      expect(isTenantScopedModel('Tenant')).toBe(false);
    });

    it('should return false for unknown models', () => {
      expect(isTenantScopedModel('UnknownModel')).toBe(false);
    });
  });

  describe('injectTenantWhere', () => {
    it('should add tenantId to existing where clause', () => {
      const result = injectTenantWhere({ name: 'John' }, 'tenant-1');
      expect(result).toEqual({ name: 'John', tenantId: 'tenant-1' });
    });

    it('should create where clause with tenantId from empty object', () => {
      const result = injectTenantWhere({}, 'tenant-1');
      expect(result).toEqual({ tenantId: 'tenant-1' });
    });

    it('should not mutate the original where object', () => {
      const original = { name: 'John' };
      injectTenantWhere(original, 'tenant-1');
      expect(original).toEqual({ name: 'John' });
    });
  });

  describe('injectTenantData', () => {
    it('should add tenantId to data', () => {
      const result = injectTenantData({ name: 'Jane', age: 30 }, 'tenant-1');
      expect(result).toEqual({ name: 'Jane', age: 30, tenantId: 'tenant-1' });
    });

    it('should not mutate the original data object', () => {
      const original = { name: 'Jane' };
      injectTenantData(original, 'tenant-1');
      expect(original).toEqual({ name: 'Jane' });
    });
  });

  describe('TENANT_SCOPED_MODELS', () => {
    it('should contain exactly 16 models', () => {
      expect(TENANT_SCOPED_MODELS.size).toBe(16);
    });

    it('should NOT contain Tenant', () => {
      expect(TENANT_SCOPED_MODELS.has('Tenant')).toBe(false);
    });
  });
});
