import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionStatusDto } from './dto/update-prescription-status.dto';
export declare class PrescriptionsController {
    private readonly prescriptionsService;
    constructor(prescriptionsService: PrescriptionsService);
    create(dto: CreatePrescriptionDto, req: any): Promise<import("./dto").PrescriptionResponseDto>;
    findAll(page: number, limit: number): Promise<import("./dto").PaginatedPrescriptionsResponseDto>;
    findOne(id: string): Promise<import("./dto").PrescriptionResponseDto>;
    updateStatus(id: string, dto: UpdatePrescriptionStatusDto): Promise<import("./dto").PrescriptionResponseDto>;
}
