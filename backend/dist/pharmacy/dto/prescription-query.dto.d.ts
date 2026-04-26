import { PrescriptionStatus } from '@prisma/client';
export declare class PrescriptionQueryDto {
    status?: PrescriptionStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
