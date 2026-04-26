"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedOrdersResponseDto = exports.OrderResponseDto = void 0;
class OrderResponseDto {
    id;
    prescriptionId;
    pharmacyId;
    status;
    trackingInfo;
    createdAt;
    updatedAt;
    prescription;
    pharmacy;
}
exports.OrderResponseDto = OrderResponseDto;
class PaginatedOrdersResponseDto {
    data;
    total;
    page;
    limit;
}
exports.PaginatedOrdersResponseDto = PaginatedOrdersResponseDto;
//# sourceMappingURL=order-response.dto.js.map