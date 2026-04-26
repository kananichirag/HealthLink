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
exports.PatientPortalController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const patient_portal_service_1 = require("./patient-portal.service");
const dto_1 = require("./dto");
let PatientPortalController = class PatientPortalController {
    patientPortalService;
    constructor(patientPortalService) {
        this.patientPortalService = patientPortalService;
    }
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
};
exports.PatientPortalController = PatientPortalController;
__decorate([
    (0, common_1.Get)('doctors'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PatientPortalController.prototype, "listDoctors", null);
__decorate([
    (0, common_1.Post)('doctors/:id/connect'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PatientPortalController.prototype, "connectWithDoctor", null);
__decorate([
    (0, common_1.Get)('doctors/:id/slots'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PatientPortalController.prototype, "getAvailableSlots", null);
__decorate([
    (0, common_1.Post)('appointments'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.BookAppointmentDto, Object]),
    __metadata("design:returntype", Promise)
], PatientPortalController.prototype, "bookAppointment", null);
__decorate([
    (0, common_1.Patch)('appointments/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PatientPortalController.prototype, "cancelAppointment", null);
__decorate([
    (0, common_1.Get)('appointments'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PatientAppointmentQueryDto, Object]),
    __metadata("design:returntype", Promise)
], PatientPortalController.prototype, "listAppointments", null);
__decorate([
    (0, common_1.Get)('prescriptions'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PatientPrescriptionQueryDto, Object]),
    __metadata("design:returntype", Promise)
], PatientPortalController.prototype, "listPrescriptions", null);
__decorate([
    (0, common_1.Get)('prescriptions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PatientPortalController.prototype, "getPrescriptionDetail", null);
exports.PatientPortalController = PatientPortalController = __decorate([
    (0, common_1.Controller)('patient'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PATIENT),
    __metadata("design:paramtypes", [patient_portal_service_1.PatientPortalService])
], PatientPortalController);
//# sourceMappingURL=patient-portal.controller.js.map