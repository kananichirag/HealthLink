"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RescheduleDto", {
    enumerable: true,
    get: function() {
        return RescheduleDto;
    }
});
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let RescheduleDto = class RescheduleDto {
};
_ts_decorate([
    (0, _classvalidator.IsDateString)({}, {
        message: 'Invalid date format'
    }),
    (0, _classvalidator.IsNotEmpty)({
        message: 'New date is required'
    }),
    _ts_metadata("design:type", String)
], RescheduleDto.prototype, "newDate", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)({
        message: 'New time slot is required'
    }),
    _ts_metadata("design:type", String)
], RescheduleDto.prototype, "newTimeSlot", void 0);

//# sourceMappingURL=reschedule.dto.js.map