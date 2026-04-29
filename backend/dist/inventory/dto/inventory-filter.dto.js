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
    get BulkUpdateStockDto () {
        return BulkUpdateStockDto;
    },
    get ExpiryStatus () {
        return ExpiryStatus;
    },
    get InventoryFilterDto () {
        return InventoryFilterDto;
    },
    get StockStatus () {
        return StockStatus;
    }
});
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
var StockStatus = /*#__PURE__*/ function(StockStatus) {
    StockStatus["LOW"] = "LOW";
    StockStatus["NORMAL"] = "NORMAL";
    return StockStatus;
}({});
var ExpiryStatus = /*#__PURE__*/ function(ExpiryStatus) {
    ExpiryStatus["EXPIRED"] = "EXPIRED";
    ExpiryStatus["EXPIRING"] = "EXPIRING";
    ExpiryStatus["NORMAL"] = "NORMAL";
    return ExpiryStatus;
}({});
let InventoryFilterDto = class InventoryFilterDto {
    constructor(){
        this.page = 1;
        this.limit = 10;
    }
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    (0, _classtransformer.Transform)(({ value })=>parseInt(value)),
    _ts_metadata("design:type", Number)
], InventoryFilterDto.prototype, "page", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    (0, _classtransformer.Transform)(({ value })=>Math.min(parseInt(value), 100)),
    _ts_metadata("design:type", Number)
], InventoryFilterDto.prototype, "limit", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], InventoryFilterDto.prototype, "search", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(StockStatus),
    _ts_metadata("design:type", String)
], InventoryFilterDto.prototype, "stockStatus", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(ExpiryStatus),
    _ts_metadata("design:type", String)
], InventoryFilterDto.prototype, "expiryStatus", void 0);
let BulkUpdateStockDto = class BulkUpdateStockDto {
};

//# sourceMappingURL=inventory-filter.dto.js.map