"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PrismaService", {
    enumerable: true,
    get: function() {
        return PrismaService;
    }
});
const _common = require("@nestjs/common");
const _client = require("@prisma/client");
const _prismatenantmiddleware = require("../tenant/prisma-tenant.middleware");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PrismaService = class PrismaService extends _client.PrismaClient {
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    /**
   * Override model delegate accessors to return the extended (tenant-filtered) versions.
   * This ensures all existing code using `this.prisma.model.operation()` gets tenant isolation.
   */ get user() {
        return this._extendedClient.user;
    }
    get patient() {
        return this._extendedClient.patient;
    }
    get medicine() {
        return this._extendedClient.medicine;
    }
    get prescription() {
        return this._extendedClient.prescription;
    }
    get prescriptionItem() {
        return this._extendedClient.prescriptionItem;
    }
    get sale() {
        return this._extendedClient.sale;
    }
    get saleItem() {
        return this._extendedClient.saleItem;
    }
    get order() {
        return this._extendedClient.order;
    }
    get payment() {
        return this._extendedClient.payment;
    }
    get notification() {
        return this._extendedClient.notification;
    }
    get tenant() {
        return this._extendedClient.tenant;
    }
    get doctorPharmacyConnection() {
        return this._extendedClient.doctorPharmacyConnection;
    }
    get allergyReport() {
        return this._extendedClient.allergyReport;
    }
    get appointment() {
        return this._extendedClient.appointment;
    }
    get doctorSchedule() {
        return this._extendedClient.doctorSchedule;
    }
    get blockedDate() {
        return this._extendedClient.blockedDate;
    }
    get purchaseRecord() {
        return this._extendedClient.purchaseRecord;
    }
    constructor(){
        super();
        this._extendedClient = this.$extends((0, _prismatenantmiddleware.createTenantExtension)());
    }
};
PrismaService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], PrismaService);

//# sourceMappingURL=prisma.service.js.map