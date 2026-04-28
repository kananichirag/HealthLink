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
exports.PatientController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const patient_service_1 = require("./patient.service");
const dto_1 = require("./dto");
let PatientController = class PatientController {
    patientService;
    constructor(patientService) {
        this.patientService = patientService;
    }
    async bookAppointment(body, req) {
        return this.patientService.bookAppointment(body, req.user.sub, req.user.tenantId);
    }
    async listAppointments(query, req) {
        return this.patientService.listAppointments(req.user.sub, req.user.tenantId, query);
    }
    async cancelAppointment(id, req) {
        await this.patientService.cancelAppointment(id, req.user.sub, req.user.tenantId);
    }
    async rescheduleAppointment(id, body, req) {
        return this.patientService.rescheduleAppointment(id, req.user.sub, req.user.tenantId, body.newDate, body.newTimeSlot);
    }
};
exports.PatientController = PatientController;
__decorate([
    (0, common_1.Post)('appointments'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.BookAppointmentDto, Object]),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "bookAppointment", null);
__decorate([
    (0, common_1.Get)('appointments'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AppointmentQueryDto, Object]),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "listAppointments", null);
__decorate([
    (0, common_1.Delete)('appointments/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "cancelAppointment", null);
__decorate([
    (0, common_1.Patch)('appointments/:id/reschedule'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.RescheduleDto, Object]),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "rescheduleAppointment", null);
exports.PatientController = PatientController = __decorate([
    (0, common_1.Controller)('patient'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PATIENT),
    __metadata("design:paramtypes", [patient_service_1.PatientService])
], PatientController);
//# sourceMappingURL=patient.controller.js.map