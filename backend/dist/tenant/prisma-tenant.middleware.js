"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get TENANT_SCOPED_MODELS () {
        return TENANT_SCOPED_MODELS;
    },
    get createTenantExtension () {
        return createTenantExtension;
    },
    get getActiveTenantId () {
        return getActiveTenantId;
    },
    get injectTenantData () {
        return injectTenantData;
    },
    get injectTenantWhere () {
        return injectTenantWhere;
    },
    get isTenantScopedModel () {
        return isTenantScopedModel;
    }
});
const _client = require("@prisma/client");
const _tenantcontext = require("./tenant-context");
const TENANT_SCOPED_MODELS = new Set([
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
    'PurchaseRecord'
]);
function getActiveTenantId() {
    const { tenantId, role } = (0, _tenantcontext.getTenantContext)();
    // Skip tenant filtering if:
    // 1. No tenant context (unauthenticated or system-level operation)
    // 2. User is Admin (cross-tenant access)
    if (!tenantId || role === 'ADMIN') {
        return null;
    }
    return tenantId;
}
function isTenantScopedModel(model) {
    return TENANT_SCOPED_MODELS.has(model);
}
function injectTenantWhere(where, tenantId) {
    return {
        ...where,
        tenantId
    };
}
function injectTenantData(data, tenantId) {
    return {
        ...data,
        tenantId
    };
}
function createTenantExtension() {
    return _client.Prisma.defineExtension({
        name: 'tenant-isolation',
        query: {
            $allOperations ({ model, operation, args, query }) {
                if (!model || !isTenantScopedModel(model)) {
                    return query(args);
                }
                const tenantId = getActiveTenantId();
                if (!tenantId) {
                    return query(args);
                }
                // Read operations: inject tenantId into WHERE
                const readOps = [
                    'findMany',
                    'findFirst',
                    'findUnique',
                    'findFirstOrThrow',
                    'findUniqueOrThrow',
                    'count',
                    'aggregate',
                    'groupBy'
                ];
                if (readOps.includes(operation)) {
                    args.where = injectTenantWhere(args.where ?? {}, tenantId);
                    return query(args);
                }
                // Single-record mutations: inject tenantId into WHERE
                const singleMutateOps = [
                    'update',
                    'delete'
                ];
                if (singleMutateOps.includes(operation)) {
                    args.where = injectTenantWhere(args.where ?? {}, tenantId);
                    return query(args);
                }
                // Bulk mutations: inject tenantId into WHERE
                const bulkMutateOps = [
                    'updateMany',
                    'deleteMany'
                ];
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
                        args.data = args.data.map((record)=>injectTenantData(record, tenantId));
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
            }
        }
    });
}

//# sourceMappingURL=prisma-tenant.middleware.js.map