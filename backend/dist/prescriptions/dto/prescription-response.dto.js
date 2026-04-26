"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedPrescriptionsResponseDto = exports.PrescriptionResponseDto = exports.PrescriptionItemResponseDto = void 0;
class PrescriptionItemResponseDto {
    id;
    medicineId;
    medicineName;
    quantity;
    createdAt;
}
exports.PrescriptionItemResponseDto = PrescriptionItemResponseDto;
class PrescriptionResponseDto {
    id;
    patientId;
    doctorId;
    status;
    createdAt;
    updatedAt;
    items;
    itemCount;
}
exports.PrescriptionResponseDto = PrescriptionResponseDto;
class PaginatedPrescriptionsResponseDto {
    data;
    total;
    page;
    limit;
}
exports.PaginatedPrescriptionsResponseDto = PaginatedPrescriptionsResponseDto;
//# sourceMappingURL=prescription-response.dto.js.map