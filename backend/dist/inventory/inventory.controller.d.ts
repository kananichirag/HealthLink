import { InventoryService } from './inventory.service';
import { CreateMedicineDto, UpdateMedicineDto, MedicineResponseDto, PaginatedMedicinesResponseDto, InventoryFilterDto, BulkUpdateStockDto } from './dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    createMedicine(createMedicineDto: CreateMedicineDto): Promise<MedicineResponseDto>;
    getMedicine(id: string): Promise<MedicineResponseDto>;
    updateMedicine(id: string, updateMedicineDto: UpdateMedicineDto): Promise<MedicineResponseDto>;
    deleteMedicine(id: string): Promise<void>;
    getMedicines(filterDto: InventoryFilterDto): Promise<PaginatedMedicinesResponseDto>;
    bulkUpdateStock(bulkUpdateDto: BulkUpdateStockDto): Promise<void>;
}
