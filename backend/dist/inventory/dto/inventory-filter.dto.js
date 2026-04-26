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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkUpdateStockDto = exports.InventoryFilterDto = exports.ExpiryStatus = exports.StockStatus = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var StockStatus;
(function (StockStatus) {
    StockStatus["LOW"] = "LOW";
    StockStatus["NORMAL"] = "NORMAL";
})(StockStatus || (exports.StockStatus = StockStatus = {}));
var ExpiryStatus;
(function (ExpiryStatus) {
    ExpiryStatus["EXPIRED"] = "EXPIRED";
    ExpiryStatus["EXPIRING"] = "EXPIRING";
    ExpiryStatus["NORMAL"] = "NORMAL";
})(ExpiryStatus || (exports.ExpiryStatus = ExpiryStatus = {}));
class InventoryFilterDto {
    page = 1;
    limit = 10;
    search;
    stockStatus;
    expiryStatus;
}
exports.InventoryFilterDto = InventoryFilterDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], InventoryFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Transform)(({ value }) => Math.min(parseInt(value), 100)),
    __metadata("design:type", Number)
], InventoryFilterDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryFilterDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(StockStatus),
    __metadata("design:type", String)
], InventoryFilterDto.prototype, "stockStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ExpiryStatus),
    __metadata("design:type", String)
], InventoryFilterDto.prototype, "expiryStatus", void 0);
class BulkUpdateStockDto {
    updates;
}
exports.BulkUpdateStockDto = BulkUpdateStockDto;
//# sourceMappingURL=inventory-filter.dto.js.map