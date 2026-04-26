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
exports.DoctorController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const doctor_service_1 = require("./doctor.service");
const dto_1 = require("./dto");
let DoctorController = class DoctorController {
    doctorService;
    constructor(doctorService) {
        this.doctorService = doctorService;
    }
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
};
exports.DoctorController = DoctorController;
__decorate([
    (0, common_1.Post)('patients'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePatientDto, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "createPatient", null);
__decorate([
    (0, common_1.Get)('patients'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PatientQueryDto, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "listPatients", null);
__decorate([
    (0, common_1.Post)('allergy-reports'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateAllergyReportDto, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "createAllergyReport", null);
__decorate([
    (0, common_1.Get)('allergy-reports/:patientId'),
    __param(0, (0, common_1.Param)('patientId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "getPatientAllergyReports", null);
__decorate([
    (0, common_1.Post)('prescriptions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePrescriptionDto, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "createPrescription", null);
__decorate([
    (0, common_1.Post)('prescriptions/:id/dispatch'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('pharmacyId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "dispatchToPharmacy", null);
__decorate([
    (0, common_1.Post)('pharmacy-connections'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RequestConnectionDto, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "requestConnection", null);
__decorate([
    (0, common_1.Get)('pharmacy-connections'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "listConnections", null);
__decorate([
    (0, common_1.Get)('pharmacies'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "listPharmacies", null);
__decorate([
    (0, common_1.Delete)('pharmacy-connections/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "terminateConnection", null);
__decorate([
    (0, common_1.Patch)('pharmacy-connections/:id/accept'),
    (0, roles_decorator_1.Roles)(client_1.Role.PHARMACY),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "acceptConnection", null);
__decorate([
    (0, common_1.Get)('appointments'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AppointmentQueryDto, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "listAppointments", null);
__decorate([
    (0, common_1.Put)('schedule'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.SetAvailabilityDto, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "setAvailability", null);
__decorate([
    (0, common_1.Post)('schedule/block'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.BlockDateDto, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "blockDate", null);
__decorate([
    (0, common_1.Delete)('schedule/block/:date'),
    __param(0, (0, common_1.Param)('date')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "unblockDate", null);
__decorate([
    (0, common_1.Put)('schedule/max-appointments'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.SetMaxAppointmentsDto, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "setMaxAppointments", null);
exports.DoctorController = DoctorController = __decorate([
    (0, common_1.Controller)('doctor'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.DOCTOR),
    __metadata("design:paramtypes", [doctor_service_1.DoctorService])
], DoctorController);
//# sourceMappingURL=doctor.controller.js.map