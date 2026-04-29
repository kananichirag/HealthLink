"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppointmentQueryDto", {
    enumerable: true,
    get: function() {
        return AppointmentQueryDto;
    }
});
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _client = require("@prisma/client");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AppointmentQueryDto = class AppointmentQueryDto {
    constructor(){
        this.page = 1;
        this.limit = 10;
    }
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_client.AppointmentStatus, {
        message: 'Status must be SCHEDULED, COMPLETED, or CANCELLED'
    }),
    _ts_metadata("design:type", typeof _client.AppointmentStatus === "undefined" ? Object : _client.AppointmentStatus)
], AppointmentQueryDto.prototype, "status", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDateString)({}, {
        message: 'Invalid start date format'
    }),
    _ts_metadata("design:type", String)
], AppointmentQueryDto.prototype, "startDate", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDateString)({}, {
        message: 'Invalid end date format'
    }),
    _ts_metadata("design:type", String)
], AppointmentQueryDto.prototype, "endDate", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsInt)({
        message: 'Page must be an integer'
    }),
    (0, _classvalidator.Min)(1, {
        message: 'Page must be at least 1'
    }),
    (0, _classtransformer.Type)(()=>Number),
    _ts_metadata("design:type", Number)
], AppointmentQueryDto.prototype, "page", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsInt)({
        message: 'Limit must be an integer'
    }),
    (0, _classvalidator.Min)(1, {
        message: 'Limit must be at least 1'
    }),
    (0, _classvalidator.Max)(100, {
        message: 'Limit cannot exceed 100'
    }),
    (0, _classtransformer.Type)(()=>Number),
    _ts_metadata("design:type", Number)
], AppointmentQueryDto.prototype, "limit", void 0);

//# sourceMappingURL=appointment-query.dto.js.map