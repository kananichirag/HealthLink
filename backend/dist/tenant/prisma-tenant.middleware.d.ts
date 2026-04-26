export declare const TENANT_SCOPED_MODELS: ReadonlySet<string>;
export declare function getActiveTenantId(): string | null;
export declare function isTenantScopedModel(model: string): boolean;
export declare function injectTenantWhere(where: any, tenantId: string): any;
export declare function injectTenantData(data: any, tenantId: string): any;
export declare function createTenantExtension(): (client: any) => {
    $extends: {
        extArgs: import("@prisma/client/runtime/library").InternalArgs<unknown, unknown, {}, unknown>;
    };
};
