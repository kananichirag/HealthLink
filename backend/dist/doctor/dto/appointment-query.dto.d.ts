import { AppointmentStatus } from '@prisma/client';
export declare class AppointmentQueryDto {
    status?: AppointmentStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
