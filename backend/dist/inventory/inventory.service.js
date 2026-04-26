"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dto_1 = require("./dto");
let InventoryService = InventoryService_1 = class InventoryService {
    prisma;
    logger = new common_1.Logger(InventoryService_1.name);
    LOW_STOCK_THRESHOLD = 10;
    EXPIRY_WARNING_DAYS = 30;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createMedicine(createMedicineDto) {
        try {
            this.logger.log(`Creating medicine: ${createMedicineDto.name}, batch: ${createMedicineDto.batchNumber}`);
            const expiryDate = new Date(createMedicineDto.expiryDate);
            const now = new Date();
            if (expiryDate <= now) {
                throw new common_1.BadRequestException('Expiry date must be in the future');
            }
            const sanitizedData = {
                ...createMedicineDto,
                name: this.sanitizeText(createMedicineDto.name),
                batchNumber: this.sanitizeText(createMedicineDto.batchNumber),
                supplier: this.sanitizeText(createMedicineDto.supplier),
                expiryDate,
            };
            const medicine = await this.prisma.medicine.create({
                data: sanitizedData,
            });
            return this.transformToResponseDto(medicine);
        }
        catch (error) {
            if (error.code === 'P2002' && error.meta?.target?.includes('batchNumber')) {
                throw new common_1.ConflictException('Batch number already exists');
            }
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error(`Failed to create medicine: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to create medicine');
        }
    }
    async findMedicineById(id) {
        try {
            const medicine = await this.prisma.medicine.findUnique({
                where: { id },
            });
            if (!medicine) {
                throw new common_1.NotFoundException(`Medicine with ID ${id} not found`);
            }
            return this.transformToResponseDto(medicine);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to find medicine by ID ${id}: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to retrieve medicine');
        }
    }
    async updateMedicine(id, updateMedicineDto) {
        try {
            this.logger.log(`Updating medicine: ${id}`);
            const existingMedicine = await this.prisma.medicine.findUnique({
                where: { id },
            });
            if (!existingMedicine) {
                throw new common_1.NotFoundException(`Medicine with ID ${id} not found`);
            }
            const sanitizedData = {};
            if (updateMedicineDto.name) {
                sanitizedData.name = this.sanitizeText(updateMedicineDto.name);
            }
            if (updateMedicineDto.batchNumber) {
                sanitizedData.batchNumber = this.sanitizeText(updateMedicineDto.batchNumber);
            }
            if (updateMedicineDto.supplier) {
                sanitizedData.supplier = this.sanitizeText(updateMedicineDto.supplier);
            }
            if (updateMedicineDto.expiryDate) {
                sanitizedData.expiryDate = updateMedicineDto.expiryDate;
            }
            if (updateMedicineDto.quantity !== undefined) {
                sanitizedData.quantity = updateMedicineDto.quantity;
            }
            const medicine = await this.prisma.medicine.update({
                where: { id },
                data: sanitizedData,
            });
            return this.transformToResponseDto(medicine);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            if (error.code === 'P2002' && error.meta?.target?.includes('batchNumber')) {
                throw new common_1.ConflictException('Batch number already exists');
            }
            this.logger.error(`Failed to update medicine ${id}: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to update medicine');
        }
    }
    async deleteMedicine(id) {
        try {
            this.logger.log(`Deleting medicine: ${id}`);
            const existingMedicine = await this.prisma.medicine.findUnique({
                where: { id },
            });
            if (!existingMedicine) {
                throw new common_1.NotFoundException(`Medicine with ID ${id} not found`);
            }
            await this.prisma.medicine.delete({
                where: { id },
            });
            this.logger.log(`Successfully deleted medicine: ${id}`);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to delete medicine ${id}: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to delete medicine');
        }
    }
    async findAllMedicines(filterDto) {
        try {
            const { page = 1, limit = 10, search, stockStatus, expiryStatus } = filterDto;
            const skip = (page - 1) * limit;
            const where = {};
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { batchNumber: { contains: search, mode: 'insensitive' } },
                    { supplier: { contains: search, mode: 'insensitive' } },
                ];
            }
            if (stockStatus === dto_1.StockStatus.LOW) {
                where.quantity = { lt: this.LOW_STOCK_THRESHOLD };
            }
            else if (stockStatus === dto_1.StockStatus.NORMAL) {
                where.quantity = { gte: this.LOW_STOCK_THRESHOLD };
            }
            const now = new Date();
            const expiryThreshold = new Date();
            expiryThreshold.setDate(now.getDate() + this.EXPIRY_WARNING_DAYS);
            if (expiryStatus === dto_1.ExpiryStatus.EXPIRED) {
                where.expiryDate = { lt: now };
            }
            else if (expiryStatus === dto_1.ExpiryStatus.EXPIRING) {
                where.expiryDate = { gte: now, lt: expiryThreshold };
            }
            else if (expiryStatus === dto_1.ExpiryStatus.NORMAL) {
                where.expiryDate = { gte: expiryThreshold };
            }
            const [total, medicines] = await Promise.all([
                this.prisma.medicine.count({ where }),
                this.prisma.medicine.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
            ]);
            const stats = await this.calculateInventoryStats();
            const transformedMedicines = medicines.map(medicine => this.transformToResponseDto(medicine));
            return {
                data: transformedMedicines,
                total,
                page,
                limit,
                stats,
            };
        }
        catch (error) {
            this.logger.error(`Failed to retrieve medicines: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to retrieve medicines');
        }
    }
    async bulkUpdateStock(bulkUpdateDto) {
        try {
            this.logger.log(`Bulk updating stock for ${bulkUpdateDto.updates.length} medicines`);
            await this.prisma.$transaction(async (prisma) => {
                for (const update of bulkUpdateDto.updates) {
                    await prisma.medicine.update({
                        where: { id: update.id },
                        data: { quantity: update.quantity },
                    });
                }
            });
            this.logger.log('Bulk stock update completed successfully');
        }
        catch (error) {
            this.logger.error(`Failed to bulk update stock: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to update stock levels');
        }
    }
    async calculateInventoryStats() {
        const now = new Date();
        const expiryThreshold = new Date();
        expiryThreshold.setDate(now.getDate() + this.EXPIRY_WARNING_DAYS);
        const [lowStock, expiring, expired, total] = await Promise.all([
            this.prisma.medicine.count({
                where: { quantity: { lt: this.LOW_STOCK_THRESHOLD } },
            }),
            this.prisma.medicine.count({
                where: { expiryDate: { gte: now, lt: expiryThreshold } },
            }),
            this.prisma.medicine.count({
                where: { expiryDate: { lt: now } },
            }),
            this.prisma.medicine.count(),
        ]);
        return { lowStock, expiring, expired, total };
    }
    transformToResponseDto(medicine) {
        const stockStatus = this.calculateStockStatus(medicine.quantity);
        const expiryStatus = this.calculateExpiryStatus(medicine.expiryDate);
        const daysUntilExpiry = this.calculateDaysUntilExpiry(medicine.expiryDate);
        const isActive = expiryStatus !== 'EXPIRED';
        return {
            id: medicine.id,
            name: medicine.name,
            batchNumber: medicine.batchNumber,
            expiryDate: medicine.expiryDate,
            quantity: medicine.quantity,
            supplier: medicine.supplier,
            createdAt: medicine.createdAt,
            updatedAt: medicine.updatedAt,
            stockStatus,
            expiryStatus,
            daysUntilExpiry,
            isActive,
        };
    }
    calculateStockStatus(quantity) {
        return quantity < this.LOW_STOCK_THRESHOLD ? 'LOW' : 'NORMAL';
    }
    calculateExpiryStatus(expiryDate) {
        const now = new Date();
        const expiryThreshold = new Date();
        expiryThreshold.setDate(now.getDate() + this.EXPIRY_WARNING_DAYS);
        if (expiryDate < now)
            return 'EXPIRED';
        if (expiryDate < expiryThreshold)
            return 'EXPIRING';
        return 'NORMAL';
    }
    calculateDaysUntilExpiry(expiryDate) {
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    sanitizeText(text) {
        return text
            .trim()
            .replace(/[<>]/g, '')
            .replace(/['"]/g, '')
            .substring(0, 255);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map