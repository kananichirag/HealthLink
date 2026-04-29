"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreatePaymentIntentDto", {
    enumerable: true,
    get: function() {
        return CreatePaymentIntentDto;
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
let CreatePaymentIntentDto = class CreatePaymentIntentDto {
};
_ts_decorate([
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    _ts_metadata("design:type", Number)
], CreatePaymentIntentDto.prototype, "amount", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Length)(3, 3),
    (0, _classvalidator.Matches)(/^[A-Za-z]{3}$/, {
        message: 'currency must be a valid ISO 4217 3-letter code'
    }),
    _ts_metadata("design:type", String)
], CreatePaymentIntentDto.prototype, "currency", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_client.PaymentType),
    _ts_metadata("design:type", typeof _client.PaymentType === "undefined" ? Object : _client.PaymentType)
], CreatePaymentIntentDto.prototype, "paymentType", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], CreatePaymentIntentDto.prototype, "orderId", void 0);

//# sourceMappingURL=create-payment-intent.dto.js.map