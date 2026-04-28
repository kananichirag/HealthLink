import { PatientService } from './patient.service';
import { AppointmentQueryDto, RescheduleDto, BookAppointmentDto } from './dto';
export declare class PatientController {
    private readonly patientService;
    constructor(patientService: PatientService);
    bookAppointment(body: BookAppointmentDto, req: any): Promise<any>;
    listAppointments(query: AppointmentQueryDto, req: any): Promise<{
        data: any[];
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    cancelAppointment(id: string, req: any): Promise<void>;
    rescheduleAppointment(id: string, body: RescheduleDto, req: any): Promise<any>;
}
