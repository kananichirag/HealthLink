import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { BookAppointmentDto } from './dto';
export declare class PatientService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    bookAppointment(dto: BookAppointmentDto, userId: string, tenantId: string): Promise<any>;
    validateCancellationWindow(appointmentId: string): Promise<boolean>;
    private calculateTimeUntilAppointment;
    private combineDateTime;
    listAppointments(userId: string, tenantId: string, filters: {
        status?: AppointmentStatus;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: any[];
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    cancelAppointment(appointmentId: string, userId: string, tenantId: string): Promise<void>;
    checkSlotAvailability(doctorId: string, date: Date, timeSlot: string, tenantId: string, excludeAppointmentId?: string): Promise<boolean>;
    addRescheduledTag(appointmentId: string): Promise<any>;
    enrichAppointmentWithTags(appointment: any): Promise<any>;
    rescheduleAppointment(appointmentId: string, userId: string, tenantId: string, newDate: string, newTimeSlot: string): Promise<any>;
}
