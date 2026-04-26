"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TENANT_SCOPED_MODELS = void 0;
exports.getActiveTenantId = getActiveTenantId;
exports.isTenantScopedModel = isTenantScopedModel;
exports.injectTenantWhere = injectTenantWhere;
exports.injectTenantData = injectTenantData;
exports.createTenantExtension = createTenantExtension;
const client_1 = require("@prisma/client");
const tenant_context_1 = require("./tenant-context");
exports.TENANT_SCOPED_MODELS = new Set([
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
function getActiveTenantId() {
    const { tenantId, role } = (0, tenant_context_1.getTenantContext)();
    if (!tenantId || role === 'ADMIN') {
        return null;
    }
    return tenantId;
}
function isTenantScopedModel(model) {
    return exports.TENANT_SCOPED_MODELS.has(model);
}
function injectTenantWhere(where, tenantId) {
    return { ...where, tenantId };
}
function injectTenantData(data, tenantId) {
    return { ...data, tenantId };
}
function createTenantExtension() {
    return client_1.Prisma.defineExtension({
        name: 'tenant-isolation',
        query: {
            $allOperations({ model, operation, args, query }) {
                if (!model || !isTenantScopedModel(model)) {
                    return query(args);
                }
                const tenantId = getActiveTenantId();
                if (!tenantId) {
                    return query(args);
                }
                const readOps = [
                    'findMany', 'findFirst', 'findUnique',
                    'findFirstOrThrow', 'findUniqueOrThrow',
                    'count', 'aggregate', 'groupBy',
                ];
                if (readOps.includes(operation)) {
                    args.where = injectTenantWhere(args.where ?? {}, tenantId);
                    return query(args);
                }
                const singleMutateOps = ['update', 'delete'];
                if (singleMutateOps.includes(operation)) {
                    args.where = injectTenantWhere(args.where ?? {}, tenantId);
                    return query(args);
                }
                const bulkMutateOps = ['updateMany', 'deleteMany'];
                if (bulkMutateOps.includes(operation)) {
                    args.where = injectTenantWhere(args.where ?? {}, tenantId);
                    return query(args);
                }
                if (operation === 'create') {
                    args.data = injectTenantData(args.data ?? {}, tenantId);
                    return query(args);
                }
                if (operation === 'createMany') {
                    if (Array.isArray(args.data)) {
                        args.data = args.data.map((record) => injectTenantData(record, tenantId));
                    }
                    return query(args);
                }
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
//# sourceMappingURL=prisma-tenant.middleware.js.map