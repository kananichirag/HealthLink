"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedPatientsResponseDto = exports.PatientResponseDto = void 0;
class PatientResponseDto {
    id;
    name;
    age;
    gender;
    medicalHistory;
    createdBy;
    createdAt;
    updatedAt;
    creator;
    ageGroup;
    recordAge;
}
exports.PatientResponseDto = PatientResponseDto;
class PaginatedPatientsResponseDto {
    data;
    total;
    page;
    limit;
}
exports.PaginatedPatientsResponseDto = PaginatedPatientsResponseDto;
//# sourceMappingURL=patient-response.dto.js.map