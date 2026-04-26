"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedMedicinesResponseDto = exports.InventoryStatsDto = exports.MedicineResponseDto = void 0;
class MedicineResponseDto {
    id;
    name;
    batchNumber;
    expiryDate;
    quantity;
    supplier;
    createdAt;
    updatedAt;
    stockStatus;
    expiryStatus;
    daysUntilExpiry;
    isActive;
}
exports.MedicineResponseDto = MedicineResponseDto;
class InventoryStatsDto {
    lowStock;
    expiring;
    expired;
    total;
}
exports.InventoryStatsDto = InventoryStatsDto;
class PaginatedMedicinesResponseDto {
    data;
    total;
    page;
    limit;
    stats;
}
exports.PaginatedMedicinesResponseDto = PaginatedMedicinesResponseDto;
//# sourceMappingURL=medicine-response.dto.js.map