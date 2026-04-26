import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicineDto, UpdateMedicineDto, MedicineResponseDto, PaginatedMedicinesResponseDto, InventoryFilterDto, BulkUpdateStockDto } from './dto';
export declare class InventoryService {
    private prisma;
    private readonly logger;
    private readonly LOW_STOCK_THRESHOLD;
    private readonly EXPIRY_WARNING_DAYS;
    constructor(prisma: PrismaService);
    createMedicine(createMedicineDto: CreateMedicineDto): Promise<MedicineResponseDto>;
    findMedicineById(id: string): Promise<MedicineResponseDto>;
    updateMedicine(id: string, updateMedicineDto: UpdateMedicineDto): Promise<MedicineResponseDto>;
    deleteMedicine(id: string): Promise<void>;
    findAllMedicines(filterDto: InventoryFilterDto): Promise<PaginatedMedicinesResponseDto>;
    bulkUpdateStock(bulkUpdateDto: BulkUpdateStockDto): Promise<void>;
    private calculateInventoryStats;
    private transformToResponseDto;
    private calculateStockStatus;
    private calculateExpiryStatus;
    private calculateDaysUntilExpiry;
    private sanitizeText;
}
