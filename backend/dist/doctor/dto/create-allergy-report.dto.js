"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreateAllergyReportDto", {
    enumerable: true,
    get: function() {
        return CreateAllergyReportDto;
    }
});
const _classvalidator = require("class-validator");
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
let CreateAllergyReportDto = class CreateAllergyReportDto {
};
_ts_decorate([
    (0, _classvalidator.IsUUID)(),
    (0, _classvalidator.IsNotEmpty)(),
    _ts_metadata("design:type", String)
], CreateAllergyReportDto.prototype, "patientId", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MaxLength)(255),
    _ts_metadata("design:type", String)
], CreateAllergyReportDto.prototype, "allergyType", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MaxLength)(2000),
    _ts_metadata("design:type", String)
], CreateAllergyReportDto.prototype, "symptoms", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_client.AllergySeverity, {
        message: 'severity must be one of: LOW, MODERATE, HIGH, CRITICAL'
    }),
    _ts_metadata("design:type", typeof _client.AllergySeverity === "undefined" ? Object : _client.AllergySeverity)
], CreateAllergyReportDto.prototype, "severity", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(2000),
    _ts_metadata("design:type", String)
], CreateAllergyReportDto.prototype, "notes", void 0);

//# sourceMappingURL=create-allergy-report.dto.js.map