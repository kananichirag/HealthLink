import { PatientPortalService } from './patient-portal.service';
import { BookAppointmentDto, PatientAppointmentQueryDto, PatientPrescriptionQueryDto } from './dto';
export declare class PatientPortalController {
    private readonly patientPortalService;
    constructor(patientPortalService: PatientPortalService);
    listDoctors(): Promise<any>;
    connectWithDoctor(doctorId: string, req: any): Promise<{
        message: string;
        doctorId: string;
    }>;
    getAvailableSlots(doctorId: string, date: string): Promise<{
        date: string;
        dayOfWeek: import("@prisma/client").$Enums.DayOfWeek;
        slots: any;
    }>;
    bookAppointment(dto: BookAppointmentDto, req: any): Promise<any>;
    cancelAppointment(id: string, req: any): Promise<any>;
    listAppointments(query: PatientAppointmentQueryDto, req: any): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    listPrescriptions(query: PatientPrescriptionQueryDto, req: any): Promise<{
        data: any[];
        total: any;
        page: number;
        limit: number;
    }>;
    getPrescriptionDetail(id: string, req: any): Promise<any>;
}
