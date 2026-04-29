"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreatePatientDto", {
    enumerable: true,
    get: function() {
        return CreatePatientDto;
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
let CreatePatientDto = class CreatePatientDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MaxLength)(255),
    _ts_metadata("design:type", String)
], CreatePatientDto.prototype, "name", void 0);
_ts_decorate([
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(0),
    (0, _classvalidator.Max)(150),
    _ts_metadata("design:type", Number)
], CreatePatientDto.prototype, "age", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_client.Gender),
    _ts_metadata("design:type", typeof _client.Gender === "undefined" ? Object : _client.Gender)
], CreatePatientDto.prototype, "gender", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(2000),
    _ts_metadata("design:type", String)
], CreatePatientDto.prototype, "medicalHistory", void 0);

//# sourceMappingURL=create-patient.dto.js.map