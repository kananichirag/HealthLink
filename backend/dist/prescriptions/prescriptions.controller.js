"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PrescriptionsController", {
    enumerable: true,
    get: function() {
        return PrescriptionsController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _rolesguard = require("../auth/guards/roles.guard");
const _rolesdecorator = require("../auth/decorators/roles.decorator");
const _client = require("@prisma/client");
const _prescriptionsservice = require("./prescriptions.service");
const _createprescriptiondto = require("./dto/create-prescription.dto");
const _updateprescriptionstatusdto = require("./dto/update-prescription-status.dto");
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
let PrescriptionsController = class PrescriptionsController {
    create(dto, req) {
        return this.prescriptionsService.createPrescription(dto, req.user.sub);
    }
    findAll(page, limit) {
        return this.prescriptionsService.findAll(page, limit);
    }
    findOne(id) {
        return this.prescriptionsService.findById(id);
    }
    updateStatus(id, dto) {
        return this.prescriptionsService.updateStatus(id, dto);
    }
    constructor(prescriptionsService){
        this.prescriptionsService = prescriptionsService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _rolesdecorator.Roles)(_client.Role.DOCTOR, _client.Role.ADMIN),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createprescriptiondto.CreatePrescriptionDto === "undefined" ? Object : _createprescriptiondto.CreatePrescriptionDto,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], PrescriptionsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _rolesdecorator.Roles)(_client.Role.DOCTOR, _client.Role.ADMIN),
    _ts_param(0, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], PrescriptionsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _rolesdecorator.Roles)(_client.Role.DOCTOR, _client.Role.ADMIN),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], PrescriptionsController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id/status'),
    (0, _rolesdecorator.Roles)(_client.Role.DOCTOR, _client.Role.ADMIN),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updateprescriptionstatusdto.UpdatePrescriptionStatusDto === "undefined" ? Object : _updateprescriptionstatusdto.UpdatePrescriptionStatusDto
    ]),
    _ts_metadata("design:returntype", void 0)
], PrescriptionsController.prototype, "updateStatus", null);
PrescriptionsController = _ts_decorate([
    (0, _common.Controller)('prescriptions'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prescriptionsservice.PrescriptionsService === "undefined" ? Object : _prescriptionsservice.PrescriptionsService
    ])
], PrescriptionsController);

//# sourceMappingURL=prescriptions.controller.js.map