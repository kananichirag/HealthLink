import { AsyncLocalStorage } from 'async_hooks';
export interface TenantContext {
    tenantId: string | null;
    role: string | null;
}
export declare const tenantStorage: AsyncLocalStorage<TenantContext>;
export declare function getTenantContext(): TenantContext;
