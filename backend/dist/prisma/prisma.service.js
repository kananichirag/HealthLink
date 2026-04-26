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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_tenant_middleware_1 = require("../tenant/prisma-tenant.middleware");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    _extendedClient;
    constructor() {
        super();
        this._extendedClient = this.$extends((0, prisma_tenant_middleware_1.createTenantExtension)());
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    get user() { return this._extendedClient.user; }
    get patient() { return this._extendedClient.patient; }
    get medicine() { return this._extendedClient.medicine; }
    get prescription() { return this._extendedClient.prescription; }
    get prescriptionItem() { return this._extendedClient.prescriptionItem; }
    get sale() { return this._extendedClient.sale; }
    get saleItem() { return this._extendedClient.saleItem; }
    get order() { return this._extendedClient.order; }
    get payment() { return this._extendedClient.payment; }
    get notification() { return this._extendedClient.notification; }
    get tenant() { return this._extendedClient.tenant; }
    get doctorPharmacyConnection() { return this._extendedClient.doctorPharmacyConnection; }
    get allergyReport() { return this._extendedClient.allergyReport; }
    get appointment() { return this._extendedClient.appointment; }
    get doctorSchedule() { return this._extendedClient.doctorSchedule; }
    get blockedDate() { return this._extendedClient.blockedDate; }
    get purchaseRecord() { return this._extendedClient.purchaseRecord; }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map