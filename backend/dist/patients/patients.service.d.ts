import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto, PatientResponseDto, PaginatedPatientsResponseDto } from './dto';
export declare class PatientsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createPatient(createPatientDto: CreatePatientDto, createdBy: string): Promise<PatientResponseDto>;
    findPatientById(id: string): Promise<PatientResponseDto>;
    updatePatient(id: string, updatePatientDto: UpdatePatientDto): Promise<PatientResponseDto>;
    findAllPatients(page?: number, limit?: number, search?: string): Promise<PaginatedPatientsResponseDto>;
    private transformToResponseDto;
    private calculateAgeGroup;
    private calculateRecordAge;
    private sanitizeText;
}
