import { AppointmentStatus } from '@prisma/client';
export declare class PatientAppointmentQueryDto {
    status?: AppointmentStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
