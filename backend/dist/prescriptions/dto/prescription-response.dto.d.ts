import { PrescriptionStatus } from '@prisma/client';
export declare class PrescriptionItemResponseDto {
    id: string;
    medicineId: string;
    medicineName: string;
    quantity: number;
    createdAt: Date;
}
export declare class PrescriptionResponseDto {
    id: string;
    patientId: string;
    doctorId: string;
    status: PrescriptionStatus;
    createdAt: Date;
    updatedAt: Date;
    items?: PrescriptionItemResponseDto[];
    itemCount?: number;
}
export declare class PaginatedPrescriptionsResponseDto {
    data: PrescriptionResponseDto[];
    total: number;
    page: number;
    limit: number;
}
