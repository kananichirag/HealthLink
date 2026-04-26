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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PharmacyController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const pharmacy_service_1 = require("./pharmacy.service");
const dto_1 = require("./dto");
const dto_2 = require("../sales/dto");
let PharmacyController = class PharmacyController {
    pharmacyService;
    constructor(pharmacyService) {
        this.pharmacyService = pharmacyService;
    }
    async listPrescriptions(query, req) {
        return this.pharmacyService.listPrescriptions(query, req.user.sub);
    }
    async dispensePrescription(id, req) {
        return this.pharmacyService.dispensePrescription(id, req.user.sub);
    }
    async listMedicines(query) {
        return this.pharmacyService.listMedicines(query);
    }
    async addMedicine(dto, req) {
        return this.pharmacyService.addMedicine(dto, req.user.tenantId);
    }
    async updateMedicine(id, dto) {
        return this.pharmacyService.updateMedicine(id, dto);
    }
    async listInventory(query, req) {
        return this.pharmacyService.listInventory(query, req.user.tenantId);
    }
    async getInventoryAlerts(req) {
        return this.pharmacyService.getInventoryAlerts(req.user.tenantId);
    }
    async recordPurchase(dto, req) {
        return this.pharmacyService.recordPurchase(dto, req.user.tenantId);
    }
    async listPurchases(query, req) {
        return this.pharmacyService.listPurchases(query, req.user.tenantId);
    }
    async getDailyReport(query, req) {
        return this.pharmacyService.getDailyReport(req.user.tenantId, query);
    }
    async getTopMedicines(query, req) {
        return this.pharmacyService.getTopMedicines(req.user.tenantId, query);
    }
    async getWeeklySummary(query, req) {
        return this.pharmacyService.getWeeklySummary(req.user.tenantId, query);
    }
    async getPaymentBreakdown(query, req) {
        return this.pharmacyService.getPaymentBreakdown(req.user.tenantId, query);
    }
    async prescriptionCheckout(dto, req) {
        return this.pharmacyService.prescriptionCheckout(dto.prescriptionId, req.user.sub);
    }
    async createSale(dto, req) {
        const userId = req.user?.sub || null;
        return this.pharmacyService.createSale(dto, userId);
    }
    async listSales(page, limit, startDate, endDate) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.pharmacyService.listSales(pageNum, limitNum, startDate, endDate);
    }
    async getSaleDetail(id) {
        return this.pharmacyService.getSaleDetail(id);
    }
    async getInvoice(id) {
        return this.pharmacyService.getInvoice(id);
    }
    async sendBillToPatient(id) {
        return this.pharmacyService.sendBillToPatient(id);
    }
};
exports.PharmacyController = PharmacyController;
__decorate([
    (0, common_1.Get)('prescriptions'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PrescriptionQueryDto, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "listPrescriptions", null);
__decorate([
    (0, common_1.Patch)('prescriptions/:id/dispense'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "dispensePrescription", null);
__decorate([
    (0, common_1.Get)('medicines'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.MedicineQueryDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "listMedicines", null);
__decorate([
    (0, common_1.Post)('medicines'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AddMedicineDto, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "addMedicine", null);
__decorate([
    (0, common_1.Put)('medicines/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateMedicineDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "updateMedicine", null);
__decorate([
    (0, common_1.Get)('inventory'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.InventoryQueryDto, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "listInventory", null);
__decorate([
    (0, common_1.Get)('inventory/alerts'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getInventoryAlerts", null);
__decorate([
    (0, common_1.Post)('purchases'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RecordPurchaseDto, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "recordPurchase", null);
__decorate([
    (0, common_1.Get)('purchases'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PurchaseQueryDto, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "listPurchases", null);
__decorate([
    (0, common_1.Get)('reports/daily'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ReportQueryDto, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getDailyReport", null);
__decorate([
    (0, common_1.Get)('reports/top-medicines'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ReportQueryDto, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getTopMedicines", null);
__decorate([
    (0, common_1.Get)('reports/weekly-summary'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ReportQueryDto, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getWeeklySummary", null);
__decorate([
    (0, common_1.Get)('reports/payment-breakdown'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ReportQueryDto, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getPaymentBreakdown", null);
__decorate([
    (0, common_1.Post)('sales/prescription-checkout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PrescriptionCheckoutDto, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "prescriptionCheckout", null);
__decorate([
    (0, common_1.Post)('sales'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_2.CreateSaleDto, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "createSale", null);
__decorate([
    (0, common_1.Get)('sales'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "listSales", null);
__decorate([
    (0, common_1.Get)('sales/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getSaleDetail", null);
__decorate([
    (0, common_1.Get)('sales/:id/invoice'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Post)('sales/:id/send-bill'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "sendBillToPatient", null);
exports.PharmacyController = PharmacyController = __decorate([
    (0, common_1.Controller)('pharmacy'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PHARMACY),
    __metadata("design:paramtypes", [pharmacy_service_1.PharmacyService])
], PharmacyController);
//# sourceMappingURL=pharmacy.controller.js.map