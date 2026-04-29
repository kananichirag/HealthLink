"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PatientPortalController", {
    enumerable: true,
    get: function() {
        return PatientPortalController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _rolesguard = require("../auth/guards/roles.guard");
const _rolesdecorator = require("../auth/decorators/roles.decorator");
const _client = require("@prisma/client");
const _patientportalservice = require("./patient-portal.service");
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
let PatientPortalController = class PatientPortalController {
    async listDoctors() {
        return this.patientPortalService.listDoctors();
    }
    async connectWithDoctor(doctorId, req) {
        return this.patientPortalService.connectWithDoctor(doctorId, req.user.sub);
    }
    async getAvailableSlots(doctorId, date) {
        return this.patientPortalService.getAvailableSlots(doctorId, date);
    }
    async bookAppointment(dto, req) {
        return this.patientPortalService.bookAppointment(dto, req.user.sub);
    }
    async cancelAppointment(id, req) {
        return this.patientPortalService.cancelAppointment(id, req.user.sub);
    }
    async listAppointments(query, req) {
        return this.patientPortalService.listAppointments(query, req.user.sub);
    }
    async listPrescriptions(query, req) {
        return this.patientPortalService.listPrescriptions(query, req.user.sub);
    }
    async getPrescriptionDetail(id, req) {
        return this.patientPortalService.getPrescriptionDetail(id, req.user.sub);
    }
    constructor(patientPortalService){
        this.patientPortalService = patientPortalService;
    }
};
_ts_decorate([
    (0, _common.Get)('doctors'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], PatientPortalController.prototype, "listDoctors", null);
_ts_decorate([
    (0, _common.Post)('doctors/:id/connect'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PatientPortalController.prototype, "connectWithDoctor", null);
_ts_decorate([
    (0, _common.Get)('doctors/:id/slots'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Query)('date')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PatientPortalController.prototype, "getAvailableSlots", null);
_ts_decorate([
    (0, _common.Post)('appointments'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.BookAppointmentDto === "undefined" ? Object : _dto.BookAppointmentDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PatientPortalController.prototype, "bookAppointment", null);
_ts_decorate([
    (0, _common.Patch)('appointments/:id/cancel'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PatientPortalController.prototype, "cancelAppointment", null);
_ts_decorate([
    (0, _common.Get)('appointments'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.PatientAppointmentQueryDto === "undefined" ? Object : _dto.PatientAppointmentQueryDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PatientPortalController.prototype, "listAppointments", null);
_ts_decorate([
    (0, _common.Get)('prescriptions'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.PatientPrescriptionQueryDto === "undefined" ? Object : _dto.PatientPrescriptionQueryDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PatientPortalController.prototype, "listPrescriptions", null);
_ts_decorate([
    (0, _common.Get)('prescriptions/:id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PatientPortalController.prototype, "getPrescriptionDetail", null);
PatientPortalController = _ts_decorate([
    (0, _common.Controller)('patient'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_client.Role.PATIENT),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _patientportalservice.PatientPortalService === "undefined" ? Object : _patientportalservice.PatientPortalService
    ])
], PatientPortalController);

//# sourceMappingURL=patient-portal.controller.js.map