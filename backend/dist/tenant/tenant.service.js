"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TenantService", {
    enumerable: true,
    get: function() {
        return TenantService;
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
let TenantService = class TenantService {
    async createTenant(dto) {
        return this.prisma.tenant.create({
            data: {
                name: dto.name,
                type: dto.type
            }
        });
    }
    async findAll() {
        return this.prisma.tenant.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async findById(id) {
        const tenant = await this.prisma.tenant.findUnique({
            where: {
                id
            }
        });
        if (!tenant) {
            throw new _common.NotFoundException(`Tenant with id ${id} not found`);
        }
        return tenant;
    }
    async activate(id) {
        await this.findById(id);
        return this.prisma.tenant.update({
            where: {
                id
            },
            data: {
                isActive: true
            }
        });
    }
    async deactivate(id) {
        await this.findById(id);
        return this.prisma.tenant.update({
            where: {
                id
            },
            data: {
                isActive: false
            }
        });
    }
    async getUserCount(id) {
        await this.findById(id);
        return this.prisma.user.count({
            where: {
                tenantId: id
            }
        });
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
TenantService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], TenantService);

//# sourceMappingURL=tenant.service.js.map