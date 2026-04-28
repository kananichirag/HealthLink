import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePatientDto, PatientQueryDto, CreateAllergyReportDto, CreatePrescriptionDto, RequestConnectionDto, SetAvailabilityDto, BlockDateDto, SetMaxAppointmentsDto, AppointmentQueryDto } from './dto';
export declare class DoctorService {
    private readonly prisma;
    private readonly notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    createPatient(dto: CreatePatientDto, userId: string, tenantId: string): Promise<any>;
    listPatients(query: PatientQueryDto, tenantId: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    createAllergyReport(dto: CreateAllergyReportDto, doctorId: string, tenantId: string): Promise<any>;
    getPatientAllergyReports(patientId: string, tenantId: string): Promise<any>;
    createPrescription(dto: CreatePrescriptionDto, doctorId: string, tenantId: string): Promise<any>;
    dispatchToPharmacy(prescriptionId: string, pharmacyId: string, doctorId: string, tenantId: string): Promise<any>;
    requestConnection(dto: RequestConnectionDto, doctorId: string, tenantId: string): Promise<any>;
    listConnections(doctorId: string): Promise<any>;
    listPharmacies(doctorId: string): Promise<any>;
    terminateConnection(connectionId: string, doctorId: string): Promise<any>;
    acceptConnection(connectionId: string, pharmacyId: string): Promise<any>;
    listAppointments(query: AppointmentQueryDto, doctorId: string, tenantId: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getSchedule(doctorId: string, tenantId: string): Promise<{
        slots: any;
        blockedDates: any;
        maxPerDay: number;
    }>;
    setAvailability(dto: SetAvailabilityDto, doctorId: string, tenantId: string): Promise<any[]>;
    blockDate(dto: BlockDateDto, doctorId: string, tenantId: string): Promise<any>;
    unblockDate(date: string, doctorId: string, tenantId: string): Promise<{
        message: string;
    }>;
    setMaxAppointments(dto: SetMaxAppointmentsDto, doctorId: string, tenantId: string): Promise<{
        doctorId: string;
        maxPerDay: number;
        tenantId: string;
    }>;
    cancelAppointment(appointmentId: string, doctorId: string, tenantId: string): Promise<{
        message: string;
    }>;
    rescheduleAppointment(appointmentId: string, doctorId: string, tenantId: string, newDate: string, newTimeSlot: string): Promise<any>;
    private isAppointmentOverdue;
    private combineDateTime;
    private checkSlotAvailability;
    private addRescheduledTag;
    completeAppointment(appointmentId: string, doctorId: string, tenantId: string): Promise<any>;
}
