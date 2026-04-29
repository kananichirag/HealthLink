"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UpdateOrderStatusDto", {
    enumerable: true,
    get: function() {
        return UpdateOrderStatusDto;
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
let UpdateOrderStatusDto = class UpdateOrderStatusDto {
};
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        _client.OrderStatus.SHIPPED,
        _client.OrderStatus.DELIVERED
    ]),
    _ts_metadata("design:type", typeof _client.OrderStatus === "undefined" ? Object : _client.OrderStatus)
], UpdateOrderStatusDto.prototype, "status", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(500),
    _ts_metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "trackingInfo", void 0);

//# sourceMappingURL=update-order-status.dto.js.map