"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PatientController", {
    enumerable: true,
    get: function() {
        return PatientController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _rolesguard = require("../auth/guards/roles.guard");
const _rolesdecorator = require("../auth/decorators/roles.decorator");
const _client = require("@prisma/client");
const _patientservice = require("./patient.service");
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
let PatientController = class PatientController {
    /**
   * Books a new appointment for the authenticated patient.
   * Validates doctor availability and checks for slot conflicts.
   * Creates appointment with SCHEDULED status.
   * 
   * @param body - Booking details (doctorId, date, timeSlot)
   * @param req - Request object containing authenticated user info
   * @returns Created appointment with patient and doctor details
   * @throws BadRequestException if slot is unavailable or doctor doesn't exist
   */ async bookAppointment(body, req) {
        return this.patientService.bookAppointment(body, req.user.sub, req.user.tenantId);
    }
    /**
   * Lists all appointments for the authenticated patient.
   * Supports filtering by status, date range, and pagination.
   * 
   * @param query - Query parameters for filtering and pagination
   * @param req - Request object containing authenticated user info
   * @returns Paginated list of appointments
   */ async listAppointments(query, req) {
        return this.patientService.listAppointments(req.user.sub, req.user.tenantId, query);
    }
    /**
   * Cancels an appointment for the authenticated patient.
   * Enforces the 30-minute cancellation rule - patients cannot cancel
   * appointments within 30 minutes of the scheduled time.
   * 
   * @param id - The appointment ID to cancel
   * @param req - Request object containing authenticated user info
   * @throws BadRequestException if within 30-minute window
   * @throws ForbiddenException if appointment doesn't belong to patient
   */ async cancelAppointment(id, req) {
        await this.patientService.cancelAppointment(id, req.user.sub, req.user.tenantId);
    }
    /**
   * Reschedules an appointment to a new date and time.
   * Enforces the same 30-minute rule as cancellation.
   * Sets the isRescheduled flag and adds a "Rescheduled" tag.
   * 
   * @param id - The appointment ID to reschedule
   * @param body - New date and time slot
   * @param req - Request object containing authenticated user info
   * @returns Updated appointment object
   * @throws BadRequestException if within 30-minute window or slot unavailable
   * @throws ForbiddenException if appointment doesn't belong to patient
   */ async rescheduleAppointment(id, body, req) {
        return this.patientService.rescheduleAppointment(id, req.user.sub, req.user.tenantId, body.newDate, body.newTimeSlot);
    }
    constructor(patientService){
        this.patientService = patientService;
    }
};
_ts_decorate([
    (0, _common.Post)('appointments'),
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
], PatientController.prototype, "bookAppointment", null);
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
], PatientController.prototype, "listAppointments", null);
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
], PatientController.prototype, "cancelAppointment", null);
_ts_decorate([
    (0, _common.Patch)('appointments/:id/reschedule'),
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
], PatientController.prototype, "rescheduleAppointment", null);
PatientController = _ts_decorate([
    (0, _common.Controller)('patient'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_client.Role.PATIENT),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _patientservice.PatientService === "undefined" ? Object : _patientservice.PatientService
    ])
], PatientController);

//# sourceMappingURL=patient.controller.js.map