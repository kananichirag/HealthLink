import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookAppointmentDto, PatientAppointmentQueryDto, PatientPrescriptionQueryDto } from './dto';
export declare class PatientPortalService {
    private readonly prisma;
    private readonly notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    private getOrCreatePatientRecord;
    listDoctors(): Promise<any>;
    connectWithDoctor(doctorId: string, userId: string): Promise<{
        message: string;
        doctorId: string;
    }>;
    getAvailableSlots(doctorId: string, date: string): Promise<{
        date: string;
        dayOfWeek: import("@prisma/client").$Enums.DayOfWeek;
        slots: any;
    }>;
    bookAppointment(dto: BookAppointmentDto, userId: string): Promise<any>;
    cancelAppointment(appointmentId: string, userId: string): Promise<any>;
    listAppointments(query: PatientAppointmentQueryDto, userId: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    listPrescriptions(query: PatientPrescriptionQueryDto, userId: string): Promise<{
        data: any[];
        total: any;
        page: number;
        limit: number;
    }>;
    getPrescriptionDetail(prescriptionId: string, userId: string): Promise<any>;
}
