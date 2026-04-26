import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionStatusDto } from './dto/update-prescription-status.dto';
import { PrescriptionResponseDto, PaginatedPrescriptionsResponseDto } from './dto/prescription-response.dto';
export declare class PrescriptionsService {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly logger;
    private readonly LOW_STOCK_THRESHOLD;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    createPrescription(dto: CreatePrescriptionDto, doctorId: string): Promise<PrescriptionResponseDto>;
    findAll(page?: number, limit?: number): Promise<PaginatedPrescriptionsResponseDto>;
    findById(id: string): Promise<PrescriptionResponseDto>;
    updateStatus(id: string, dto: UpdatePrescriptionStatusDto): Promise<PrescriptionResponseDto>;
    private toResponseDto;
}
