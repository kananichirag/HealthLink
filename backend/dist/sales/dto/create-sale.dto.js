"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CreateSaleDto () {
        return CreateSaleDto;
    },
    get SaleItemDto () {
        return SaleItemDto;
    }
});
const _classtransformer = require("class-transformer");
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
let SaleItemDto = class SaleItemDto {
};
_ts_decorate([
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], SaleItemDto.prototype, "medicineId", void 0);
_ts_decorate([
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    _ts_metadata("design:type", Number)
], SaleItemDto.prototype, "quantity", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    _ts_metadata("design:type", Number)
], SaleItemDto.prototype, "pricePerUnit", void 0);
let CreateSaleDto = class CreateSaleDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(255),
    _ts_metadata("design:type", String)
], CreateSaleDto.prototype, "customerName", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], CreateSaleDto.prototype, "prescriptionId", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_client.SalePaymentMethod),
    _ts_metadata("design:type", typeof _client.SalePaymentMethod === "undefined" ? Object : _client.SalePaymentMethod)
], CreateSaleDto.prototype, "paymentMethod", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_client.DiscountType),
    _ts_metadata("design:type", typeof _client.DiscountType === "undefined" ? Object : _client.DiscountType)
], CreateSaleDto.prototype, "discountType", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    _ts_metadata("design:type", Number)
], CreateSaleDto.prototype, "discount", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    (0, _classvalidator.Max)(100),
    _ts_metadata("design:type", Number)
], CreateSaleDto.prototype, "taxRate", void 0);
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>SaleItemDto),
    _ts_metadata("design:type", Array)
], CreateSaleDto.prototype, "items", void 0);

//# sourceMappingURL=create-sale.dto.js.map