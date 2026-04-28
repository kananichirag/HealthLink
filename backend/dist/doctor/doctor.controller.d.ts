import { DoctorService } from './doctor.service';
import { CreatePatientDto, PatientQueryDto, CreateAllergyReportDto, CreatePrescriptionDto, RequestConnectionDto, SetAvailabilityDto, BlockDateDto, SetMaxAppointmentsDto, AppointmentQueryDto, RescheduleDto } from './dto';
export declare class DoctorController {
    private readonly doctorService;
    constructor(doctorService: DoctorService);
    createPatient(dto: CreatePatientDto, req: any): Promise<any>;
    listPatients(query: PatientQueryDto, req: any): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    createAllergyReport(dto: CreateAllergyReportDto, req: any): Promise<any>;
    getPatientAllergyReports(patientId: string, req: any): Promise<any>;
    createPrescription(dto: CreatePrescriptionDto, req: any): Promise<any>;
    dispatchToPharmacy(id: string, pharmacyId: string, req: any): Promise<any>;
    requestConnection(dto: RequestConnectionDto, req: any): Promise<any>;
    listConnections(req: any): Promise<any>;
    listPharmacies(req: any): Promise<any>;
    terminateConnection(id: string, req: any): Promise<any>;
    acceptConnection(id: string, req: any): Promise<any>;
    listAppointments(query: AppointmentQueryDto, req: any): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getSchedule(req: any): Promise<{
        slots: any;
        blockedDates: any;
        maxPerDay: number;
    }>;
    setAvailability(dto: SetAvailabilityDto, req: any): Promise<any[]>;
    blockDate(dto: BlockDateDto, req: any): Promise<any>;
    unblockDate(date: string, req: any): Promise<{
        message: string;
    }>;
    setMaxAppointments(dto: SetMaxAppointmentsDto, req: any): Promise<{
        doctorId: string;
        maxPerDay: number;
        tenantId: string;
    }>;
    cancelAppointment(id: string, req: any): Promise<{
        message: string;
    }>;
    rescheduleAppointment(id: string, dto: RescheduleDto, req: any): Promise<any>;
    completeAppointment(id: string, req: any): Promise<any>;
}
