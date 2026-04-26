import { Prisma } from '@prisma/client';
import { getTenantContext } from './tenant-context';

/**
 * Tenant-scoped models that require tenantId filtering.
 * The Tenant model itself is NOT tenant-scoped.
 */
export const TENANT_SCOPED_MODELS: ReadonlySet<string> = new Set([
  'User',
  'Patient',
  'Medicine',
  'Prescription',
  'PrescriptionItem',
  'Sale',
  'SaleItem',
  'Order',
  'Payment',
  'Notification',
  'DoctorPharmacyConnection',
  'AllergyReport',
  'Appointment',
  'DoctorSchedule',
  'BlockedDate',
  'PurchaseRecord',
]);

/**
 * Determines whether tenant filtering should be applied for the current context.
 * Returns the tenantId if filtering should be applied, or null if it should be skipped.
 */
export function getActiveTenantId(): string | null {
  const { tenantId, role } = getTenantContext();

  // Skip tenant filtering if:
  // 1. No tenant context (unauthenticated or system-level operation)
  // 2. User is Admin (cross-tenant access)
  if (!tenantId || role === 'ADMIN') {
    return null;
  }

  return tenantId;
}

/**
 * Checks if a given model name is tenant-scoped.
 */
export function isTenantScopedModel(model: string): boolean {
  return TENANT_SCOPED_MODELS.has(model);
}

/**
 * Injects tenantId into a where clause for query filtering.
 */
export function injectTenantWhere(where: any, tenantId: string): any {
  return { ...where, tenantId };
}

/**
 * Injects tenantId into data for record creation.
 */
export function injectTenantData(data: any, tenantId: string): any {
  return { ...data, tenantId };
}

/**
 * Creates a Prisma Client Extension that injects tenantId into queries
 * for tenant-scoped models. Skips injection for Admin role and
 * non-tenant-scoped models (e.g., Tenant itself).
 *
 * Uses Prisma's $allOperations query extension to intercept all operations.
 */
export function createTenantExtension() {
  return Prisma.defineExtension({
    name: 'tenant-isolation',
    query: {
      $allOperations({ model, operation, args, query }: { model?: string | undefined; operation: string; args: any; query: (args: any) => Promise<any> }) {
        if (!model || !isTenantScopedModel(model)) {
          return query(args);
        }

        const tenantId = getActiveTenantId();
        if (!tenantId) {
          return query(args);
        }

        // Read operations: inject tenantId into WHERE
        const readOps = [
          'findMany', 'findFirst', 'findUnique',
          'findFirstOrThrow', 'findUniqueOrThrow',
          'count', 'aggregate', 'groupBy',
        ];

        if (readOps.includes(operation)) {
          args.where = injectTenantWhere(args.where ?? {}, tenantId);
          return query(args);
        }

        // Single-record mutations: inject tenantId into WHERE
        const singleMutateOps = ['update', 'delete'];
        if (singleMutateOps.includes(operation)) {
          args.where = injectTenantWhere(args.where ?? {}, tenantId);
          return query(args);
        }

        // Bulk mutations: inject tenantId into WHERE
        const bulkMutateOps = ['updateMany', 'deleteMany'];
        if (bulkMutateOps.includes(operation)) {
          args.where = injectTenantWhere(args.where ?? {}, tenantId);
          return query(args);
        }

        // Create: inject tenantId into data
        if (operation === 'create') {
          args.data = injectTenantData(args.data ?? {}, tenantId);
          return query(args);
        }

        // CreateMany: inject tenantId into each record
        if (operation === 'createMany') {
          if (Array.isArray(args.data)) {
            args.data = args.data.map((record: any) => injectTenantData(record, tenantId));
          }
          return query(args);
        }

        // Upsert: inject tenantId into WHERE and create data
        if (operation === 'upsert') {
          args.where = injectTenantWhere(args.where ?? {}, tenantId);
          if (args.create) {
            args.create = injectTenantData(args.create, tenantId);
          }
          return query(args);
        }

        return query(args);
      },
    },
  });
}
