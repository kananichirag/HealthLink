"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PharmacyController", {
    enumerable: true,
    get: function() {
        return PharmacyController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _rolesguard = require("../auth/guards/roles.guard");
const _rolesdecorator = require("../auth/decorators/roles.decorator");
const _client = require("@prisma/client");
const _pharmacyservice = require("./pharmacy.service");
const _dto = require("./dto");
const _dto1 = require("../sales/dto");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let PharmacyController = class PharmacyController {
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
    // ─── Inventory ───
    async listInventory(query, req) {
        return this.pharmacyService.listInventory(query, req.user.tenantId);
    }
    async getInventoryAlerts(req) {
        return this.pharmacyService.getInventoryAlerts(req.user.tenantId);
    }
    // ─── Purchases ───
    async recordPurchase(dto, req) {
        return this.pharmacyService.recordPurchase(dto, req.user.tenantId);
    }
    async listPurchases(query, req) {
        return this.pharmacyService.listPurchases(query, req.user.tenantId);
    }
    // ─── Reports ───
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
    // ─── Sales ───
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
    constructor(pharmacyService){
        this.pharmacyService = pharmacyService;
    }
};
_ts_decorate([
    (0, _common.Get)('prescriptions'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.PrescriptionQueryDto === "undefined" ? Object : _dto.PrescriptionQueryDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "listPrescriptions", null);
_ts_decorate([
    (0, _common.Patch)('prescriptions/:id/dispense'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "dispensePrescription", null);
_ts_decorate([
    (0, _common.Get)('medicines'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.MedicineQueryDto === "undefined" ? Object : _dto.MedicineQueryDto
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "listMedicines", null);
_ts_decorate([
    (0, _common.Post)('medicines'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.AddMedicineDto === "undefined" ? Object : _dto.AddMedicineDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "addMedicine", null);
_ts_decorate([
    (0, _common.Put)('medicines/:id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.UpdateMedicineDto === "undefined" ? Object : _dto.UpdateMedicineDto
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "updateMedicine", null);
_ts_decorate([
    (0, _common.Get)('inventory'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.InventoryQueryDto === "undefined" ? Object : _dto.InventoryQueryDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "listInventory", null);
_ts_decorate([
    (0, _common.Get)('inventory/alerts'),
    _ts_param(0, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "getInventoryAlerts", null);
_ts_decorate([
    (0, _common.Post)('purchases'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.RecordPurchaseDto === "undefined" ? Object : _dto.RecordPurchaseDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "recordPurchase", null);
_ts_decorate([
    (0, _common.Get)('purchases'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.PurchaseQueryDto === "undefined" ? Object : _dto.PurchaseQueryDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "listPurchases", null);
_ts_decorate([
    (0, _common.Get)('reports/daily'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.ReportQueryDto === "undefined" ? Object : _dto.ReportQueryDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "getDailyReport", null);
_ts_decorate([
    (0, _common.Get)('reports/top-medicines'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.ReportQueryDto === "undefined" ? Object : _dto.ReportQueryDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "getTopMedicines", null);
_ts_decorate([
    (0, _common.Get)('reports/weekly-summary'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.ReportQueryDto === "undefined" ? Object : _dto.ReportQueryDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "getWeeklySummary", null);
_ts_decorate([
    (0, _common.Get)('reports/payment-breakdown'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.ReportQueryDto === "undefined" ? Object : _dto.ReportQueryDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "getPaymentBreakdown", null);
_ts_decorate([
    (0, _common.Post)('sales/prescription-checkout'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.PrescriptionCheckoutDto === "undefined" ? Object : _dto.PrescriptionCheckoutDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "prescriptionCheckout", null);
_ts_decorate([
    (0, _common.Post)('sales'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto1.CreateSaleDto === "undefined" ? Object : _dto1.CreateSaleDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "createSale", null);
_ts_decorate([
    (0, _common.Get)('sales'),
    _ts_param(0, (0, _common.Query)('page')),
    _ts_param(1, (0, _common.Query)('limit')),
    _ts_param(2, (0, _common.Query)('startDate')),
    _ts_param(3, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "listSales", null);
_ts_decorate([
    (0, _common.Get)('sales/:id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "getSaleDetail", null);
_ts_decorate([
    (0, _common.Get)('sales/:id/invoice'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "getInvoice", null);
_ts_decorate([
    (0, _common.Post)('sales/:id/send-bill'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PharmacyController.prototype, "sendBillToPatient", null);
PharmacyController = _ts_decorate([
    (0, _common.Controller)('pharmacy'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_client.Role.PHARMACY),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _pharmacyservice.PharmacyService === "undefined" ? Object : _pharmacyservice.PharmacyService
    ])
], PharmacyController);

//# sourceMappingURL=pharmacy.controller.js.map