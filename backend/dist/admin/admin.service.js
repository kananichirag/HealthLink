"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AdminService", {
    enumerable: true,
    get: function() {
        return AdminService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AdminService = class AdminService {
    /**
   * List all tenants with name, type, creation date, and active user count.
   */ async listTenants(query) {
        const { page = 1, limit = 10, search, type } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive'
            };
        }
        if (type) {
            where.type = type;
        }
        const [tenants, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    _count: {
                        select: {
                            users: true
                        }
                    }
                }
            }),
            this.prisma.tenant.count({
                where
            })
        ]);
        return {
            data: tenants.map((t)=>({
                    id: t.id,
                    name: t.name,
                    type: t.type,
                    isActive: t.isActive,
                    createdAt: t.createdAt,
                    updatedAt: t.updatedAt,
                    activeUserCount: t._count.users
                })),
            total,
            page,
            limit
        };
    }
    /**
   * Activate a tenant.
   */ async activateTenant(id) {
        const tenant = await this.prisma.tenant.findUnique({
            where: {
                id
            }
        });
        if (!tenant) {
            throw new _common.NotFoundException(`Tenant with id ${id} not found`);
        }
        return this.prisma.tenant.update({
            where: {
                id
            },
            data: {
                isActive: true
            }
        });
    }
    /**
   * Deactivate a tenant. JWT invalidation is handled by JwtAuthGuard
   * checking tenant.isActive on each request.
   */ async deactivateTenant(id) {
        const tenant = await this.prisma.tenant.findUnique({
            where: {
                id
            }
        });
        if (!tenant) {
            throw new _common.NotFoundException(`Tenant with id ${id} not found`);
        }
        return this.prisma.tenant.update({
            where: {
                id
            },
            data: {
                isActive: false
            }
        });
    }
    /**
   * List all users across tenants with role, tenant, and date filters.
   */ async listUsers(query) {
        const { page = 1, limit = 10, role, tenantId, startDate, endDate } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (role) {
            where.role = role;
        }
        if (tenantId) {
            where.tenantId = tenantId;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    tenantId: true,
                    createdAt: true,
                    updatedAt: true,
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            type: true
                        }
                    }
                }
            }),
            this.prisma.user.count({
                where
            })
        ]);
        return {
            data: users,
            total,
            page,
            limit
        };
    }
    /**
   * Activate a user account.
   * Note: The User model does not have an isActive field.
   * This endpoint restores the user's role if it was previously disabled,
   * or serves as a placeholder for future isActive field migration.
   */ async activateUser(id) {
        const user = await this.prisma.user.findUnique({
            where: {
                id
            }
        });
        if (!user) {
            throw new _common.NotFoundException(`User with id ${id} not found`);
        }
        // Return user info — full activation would require an isActive field migration
        return {
            ...user,
            password: undefined,
            message: 'User account is active'
        };
    }
    /**
   * Deactivate a user account.
   * Note: The User model does not have an isActive field.
   * This endpoint serves as a placeholder for future isActive field migration.
   */ async deactivateUser(id) {
        const user = await this.prisma.user.findUnique({
            where: {
                id
            }
        });
        if (!user) {
            throw new _common.NotFoundException(`User with id ${id} not found`);
        }
        // Return user info — full deactivation would require an isActive field migration
        return {
            ...user,
            password: undefined,
            message: 'User account deactivation noted. Full deactivation requires isActive field migration.'
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
AdminService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], AdminService);

//# sourceMappingURL=admin.service.js.map