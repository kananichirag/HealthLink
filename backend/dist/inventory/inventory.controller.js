"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InventoryController", {
    enumerable: true,
    get: function() {
        return InventoryController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _rolesguard = require("../auth/guards/roles.guard");
const _rolesdecorator = require("../auth/decorators/roles.decorator");
const _client = require("@prisma/client");
const _inventoryservice = require("./inventory.service");
const _dto = require("./dto");
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
let InventoryController = class InventoryController {
    async createMedicine(createMedicineDto) {
        return this.inventoryService.createMedicine(createMedicineDto);
    }
    async getMedicine(id) {
        return this.inventoryService.findMedicineById(id);
    }
    async updateMedicine(id, updateMedicineDto) {
        return this.inventoryService.updateMedicine(id, updateMedicineDto);
    }
    async deleteMedicine(id) {
        return this.inventoryService.deleteMedicine(id);
    }
    async getMedicines(filterDto) {
        return this.inventoryService.findAllMedicines(filterDto);
    }
    async bulkUpdateStock(bulkUpdateDto) {
        return this.inventoryService.bulkUpdateStock(bulkUpdateDto);
    }
    constructor(inventoryService){
        this.inventoryService = inventoryService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)(_common.ValidationPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.CreateMedicineDto === "undefined" ? Object : _dto.CreateMedicineDto
    ]),
    _ts_metadata("design:returntype", Promise)
], InventoryController.prototype, "createMedicine", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], InventoryController.prototype, "getMedicine", null);
_ts_decorate([
    (0, _common.Put)(':id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)(_common.ValidationPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.UpdateMedicineDto === "undefined" ? Object : _dto.UpdateMedicineDto
    ]),
    _ts_metadata("design:returntype", Promise)
], InventoryController.prototype, "updateMedicine", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], InventoryController.prototype, "deleteMedicine", null);
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _common.Query)(_common.ValidationPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.InventoryFilterDto === "undefined" ? Object : _dto.InventoryFilterDto
    ]),
    _ts_metadata("design:returntype", Promise)
], InventoryController.prototype, "getMedicines", null);
_ts_decorate([
    (0, _common.Put)('bulk-update'),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _rolesdecorator.Roles)(_client.Role.ADMIN, _client.Role.PHARMACY),
    _ts_param(0, (0, _common.Body)(_common.ValidationPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.BulkUpdateStockDto === "undefined" ? Object : _dto.BulkUpdateStockDto
    ]),
    _ts_metadata("design:returntype", Promise)
], InventoryController.prototype, "bulkUpdateStock", null);
InventoryController = _ts_decorate([
    (0, _common.Controller)('inventory'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_client.Role.DOCTOR, _client.Role.ADMIN, _client.Role.PHARMACY),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _inventoryservice.InventoryService === "undefined" ? Object : _inventoryservice.InventoryService
    ])
], InventoryController);

//# sourceMappingURL=inventory.controller.js.map