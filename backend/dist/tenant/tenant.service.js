"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TenantService = class TenantService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTenant(dto) {
        return this.prisma.tenant.create({
            data: {
                name: dto.name,
                type: dto.type,
            },
        });
    }
    async findAll() {
        return this.prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant) {
            throw new common_1.NotFoundException(`Tenant with id ${id} not found`);
        }
        return tenant;
    }
    async activate(id) {
        await this.findById(id);
        return this.prisma.tenant.update({
            where: { id },
            data: { isActive: true },
        });
    }
    async deactivate(id) {
        await this.findById(id);
        return this.prisma.tenant.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async getUserCount(id) {
        await this.findById(id);
        return this.prisma.user.count({
            where: { tenantId: id },
        });
    }
};
exports.TenantService = TenantService;
exports.TenantService = TenantService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantService);
//# sourceMappingURL=tenant.service.js.map