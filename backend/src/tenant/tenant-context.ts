import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string | null;
  role: string | null;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Get the current tenant context from AsyncLocalStorage.
 * Returns null values if no context is set (e.g., unauthenticated requests).
 */
export function getTenantContext(): TenantContext {
  return tenantStorage.getStore() ?? { tenantId: null, role: null };
}
