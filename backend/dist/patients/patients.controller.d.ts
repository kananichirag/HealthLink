import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto, PatientResponseDto, PaginatedPatientsResponseDto } from './dto';
export declare class PatientsController {
    private readonly patientsService;
    constructor(patientsService: PatientsService);
    createPatient(createPatientDto: CreatePatientDto, req: any): Promise<PatientResponseDto>;
    getPatient(id: string): Promise<PatientResponseDto>;
    updatePatient(id: string, updatePatientDto: UpdatePatientDto): Promise<PatientResponseDto>;
    getPatients(page: number, limit: number, search?: string): Promise<PaginatedPatientsResponseDto>;
}
