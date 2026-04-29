"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DoctorController", {
    enumerable: true,
    get: function() {
        return DoctorController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _rolesguard = require("../auth/guards/roles.guard");
const _rolesdecorator = require("../auth/decorators/roles.decorator");
const _client = require("@prisma/client");
const _doctorservice = require("./doctor.service");
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
let DoctorController = class DoctorController {
    async createPatient(dto, req) {
        return this.doctorService.createPatient(dto, req.user.sub, req.user.tenantId);
    }
    async listPatients(query, req) {
        return this.doctorService.listPatients(query, req.user.tenantId);
    }
    async createAllergyReport(dto, req) {
        return this.doctorService.createAllergyReport(dto, req.user.sub, req.user.tenantId);
    }
    async getPatientAllergyReports(patientId, req) {
        return this.doctorService.getPatientAllergyReports(patientId, req.user.tenantId);
    }
    async createPrescription(dto, req) {
        return this.doctorService.createPrescription(dto, req.user.sub, req.user.tenantId);
    }
    async dispatchToPharmacy(id, pharmacyId, req) {
        return this.doctorService.dispatchToPharmacy(id, pharmacyId, req.user.sub, req.user.tenantId);
    }
    async requestConnection(dto, req) {
        return this.doctorService.requestConnection(dto, req.user.sub, req.user.tenantId);
    }
    async listConnections(req) {
        return this.doctorService.listConnections(req.user.sub);
    }
    async listPharmacies(req) {
        return this.doctorService.listPharmacies(req.user.sub);
    }
    async terminateConnection(id, req) {
        return this.doctorService.terminateConnection(id, req.user.sub);
    }
    async acceptConnection(id, req) {
        return this.doctorService.acceptConnection(id, req.user.sub);
    }
    async listAppointments(query, req) {
        return this.doctorService.listAppointments(query, req.user.sub, req.user.tenantId);
    }
    async getSchedule(req) {
        return this.doctorService.getSchedule(req.user.sub, req.user.tenantId);
    }
    async setAvailability(dto, req) {
        return this.doctorService.setAvailability(dto, req.user.sub, req.user.tenantId);
    }
    async blockDate(dto, req) {
        return this.doctorService.blockDate(dto, req.user.sub, req.user.tenantId);
    }
    async unblockDate(date, req) {
        return this.doctorService.unblockDate(date, req.user.sub, req.user.tenantId);
    }
    async setMaxAppointments(dto, req) {
        return this.doctorService.setMaxAppointments(dto, req.user.sub, req.user.tenantId);
    }
    async cancelAppointment(id, req) {
        return this.doctorService.cancelAppointment(id, req.user.sub, req.user.tenantId);
    }
    async rescheduleAppointment(id, dto, req) {
        return this.doctorService.rescheduleAppointment(id, req.user.sub, req.user.tenantId, dto.newDate, dto.newTimeSlot);
    }
    async completeAppointment(id, req) {
        return this.doctorService.completeAppointment(id, req.user.sub, req.user.tenantId);
    }
    constructor(doctorService){
        this.doctorService = doctorService;
    }
};
_ts_decorate([
    (0, _common.Post)('patients'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.CreatePatientDto === "undefined" ? Object : _dto.CreatePatientDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "createPatient", null);
_ts_decorate([
    (0, _common.Get)('patients'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.PatientQueryDto === "undefined" ? Object : _dto.PatientQueryDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "listPatients", null);
_ts_decorate([
    (0, _common.Post)('allergy-reports'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.CreateAllergyReportDto === "undefined" ? Object : _dto.CreateAllergyReportDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "createAllergyReport", null);
_ts_decorate([
    (0, _common.Get)('allergy-reports/:patientId'),
    _ts_param(0, (0, _common.Param)('patientId')),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "getPatientAllergyReports", null);
_ts_decorate([
    (0, _common.Post)('prescriptions'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.CreatePrescriptionDto === "undefined" ? Object : _dto.CreatePrescriptionDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "createPrescription", null);
_ts_decorate([
    (0, _common.Post)('prescriptions/:id/dispatch'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('pharmacyId')),
    _ts_param(2, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "dispatchToPharmacy", null);
_ts_decorate([
    (0, _common.Post)('pharmacy-connections'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.RequestConnectionDto === "undefined" ? Object : _dto.RequestConnectionDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "requestConnection", null);
_ts_decorate([
    (0, _common.Get)('pharmacy-connections'),
    _ts_param(0, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "listConnections", null);
_ts_decorate([
    (0, _common.Get)('pharmacies'),
    _ts_param(0, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "listPharmacies", null);
_ts_decorate([
    (0, _common.Delete)('pharmacy-connections/:id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "terminateConnection", null);
_ts_decorate([
    (0, _common.Patch)('pharmacy-connections/:id/accept'),
    (0, _rolesdecorator.Roles)(_client.Role.PHARMACY),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "acceptConnection", null);
_ts_decorate([
    (0, _common.Get)('appointments'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.AppointmentQueryDto === "undefined" ? Object : _dto.AppointmentQueryDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "listAppointments", null);
_ts_decorate([
    (0, _common.Get)('schedule'),
    _ts_param(0, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "getSchedule", null);
_ts_decorate([
    (0, _common.Put)('schedule'),
    _ts_param(0, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.SetAvailabilityDto === "undefined" ? Object : _dto.SetAvailabilityDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "setAvailability", null);
_ts_decorate([
    (0, _common.Post)('schedule/block'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.BlockDateDto === "undefined" ? Object : _dto.BlockDateDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "blockDate", null);
_ts_decorate([
    (0, _common.Delete)('schedule/block/:date'),
    _ts_param(0, (0, _common.Param)('date')),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "unblockDate", null);
_ts_decorate([
    (0, _common.Put)('schedule/max-appointments'),
    _ts_param(0, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.SetMaxAppointmentsDto === "undefined" ? Object : _dto.SetMaxAppointmentsDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "setMaxAppointments", null);
_ts_decorate([
    (0, _common.Delete)('appointments/:id'),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "cancelAppointment", null);
_ts_decorate([
    (0, _common.Patch)('appointments/:id/reschedule'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_param(2, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.RescheduleDto === "undefined" ? Object : _dto.RescheduleDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "rescheduleAppointment", null);
_ts_decorate([
    (0, _common.Patch)('appointments/:id/complete'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorController.prototype, "completeAppointment", null);
DoctorController = _ts_decorate([
    (0, _common.Controller)('doctor'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_client.Role.DOCTOR),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _doctorservice.DoctorService === "undefined" ? Object : _doctorservice.DoctorService
    ])
], DoctorController);

//# sourceMappingURL=doctor.controller.js.map