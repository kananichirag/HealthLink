import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMedicineDto,
  UpdateMedicineDto,
  MedicineResponseDto,
  PaginatedMedicinesResponseDto,
  InventoryFilterDto,
  StockStatus,
  ExpiryStatus,
  BulkUpdateStockDto,
  InventoryStatsDto,
} from './dto';
import { Medicine, Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  private readonly LOW_STOCK_THRESHOLD = 10;
  private readonly EXPIRY_WARNING_DAYS = 30;

  constructor(private prisma: PrismaService) {}

  async createMedicine(createMedicineDto: CreateMedicineDto): Promise<MedicineResponseDto> {
    try {
      this.logger.log(`Creating medicine: ${createMedicineDto.name}, batch: ${createMedicineDto.batchNumber}`);

      // Validate expiry date is in the future
      const expiryDate = new Date(createMedicineDto.expiryDate);
      const now = new Date();
      if (expiryDate <= now) {
        throw new BadRequestException('Expiry date must be in the future');
      }

      // Sanitize text inputs
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
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('batchNumber')) {
        throw new ConflictException('Batch number already exists');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create medicine: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create medicine');
    }
  }

  async findMedicineById(id: string): Promise<MedicineResponseDto> {
    try {
      const medicine = await this.prisma.medicine.findUnique({
        where: { id },
      });

      if (!medicine) {
        throw new NotFoundException(`Medicine with ID ${id} not found`);
      }

      return this.transformToResponseDto(medicine);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find medicine by ID ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve medicine');
    }
  }

  async updateMedicine(id: string, updateMedicineDto: UpdateMedicineDto): Promise<MedicineResponseDto> {
    try {
      this.logger.log(`Updating medicine: ${id}`);

      // Check if medicine exists
      const existingMedicine = await this.prisma.medicine.findUnique({
        where: { id },
      });

      if (!existingMedicine) {
        throw new NotFoundException(`Medicine with ID ${id} not found`);
      }

      // Sanitize text inputs
      const sanitizedData: Partial<UpdateMedicineDto> = {};
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('batchNumber')) {
        throw new ConflictException('Batch number already exists');
      }
      this.logger.error(`Failed to update medicine ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update medicine');
    }
  }

  async deleteMedicine(id: string): Promise<void> {
    try {
      this.logger.log(`Deleting medicine: ${id}`);

      const existingMedicine = await this.prisma.medicine.findUnique({
        where: { id },
      });

      if (!existingMedicine) {
        throw new NotFoundException(`Medicine with ID ${id} not found`);
      }

      await this.prisma.medicine.delete({
        where: { id },
      });

      this.logger.log(`Successfully deleted medicine: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete medicine ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete medicine');
    }
  }

  async findAllMedicines(filterDto: InventoryFilterDto): Promise<PaginatedMedicinesResponseDto> {
    try {
      const { page = 1, limit = 10, search, stockStatus, expiryStatus } = filterDto;
      const skip = (page - 1) * limit;

      // Build search conditions
      const where: Prisma.MedicineWhereInput = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { batchNumber: { contains: search, mode: 'insensitive' } },
          { supplier: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Apply stock status filter
      if (stockStatus === StockStatus.LOW) {
        where.quantity = { lt: this.LOW_STOCK_THRESHOLD };
      } else if (stockStatus === StockStatus.NORMAL) {
        where.quantity = { gte: this.LOW_STOCK_THRESHOLD };
      }

      // Apply expiry status filter
      const now = new Date();
      const expiryThreshold = new Date();
      expiryThreshold.setDate(now.getDate() + this.EXPIRY_WARNING_DAYS);

      if (expiryStatus === ExpiryStatus.EXPIRED) {
        where.expiryDate = { lt: now };
      } else if (expiryStatus === ExpiryStatus.EXPIRING) {
        where.expiryDate = { gte: now, lt: expiryThreshold };
      } else if (expiryStatus === ExpiryStatus.NORMAL) {
        where.expiryDate = { gte: expiryThreshold };
      }

      // Get total count and medicines in parallel
      const [total, medicines] = await Promise.all([
        this.prisma.medicine.count({ where }),
        this.prisma.medicine.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Calculate inventory statistics
      const stats = await this.calculateInventoryStats();

      const transformedMedicines = medicines.map(medicine => this.transformToResponseDto(medicine));

      return {
        data: transformedMedicines,
        total,
        page,
        limit,
        stats,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve medicines: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve medicines');
    }
  }

  async bulkUpdateStock(bulkUpdateDto: BulkUpdateStockDto): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Failed to bulk update stock: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update stock levels');
    }
  }

  private async calculateInventoryStats(): Promise<InventoryStatsDto> {
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

  private transformToResponseDto(medicine: Medicine): MedicineResponseDto {
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

  private calculateStockStatus(quantity: number): 'LOW' | 'NORMAL' {
    return quantity < this.LOW_STOCK_THRESHOLD ? 'LOW' : 'NORMAL';
  }

  private calculateExpiryStatus(expiryDate: Date): 'EXPIRED' | 'EXPIRING' | 'NORMAL' {
    const now = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(now.getDate() + this.EXPIRY_WARNING_DAYS);

    if (expiryDate < now) return 'EXPIRED';
    if (expiryDate < expiryThreshold) return 'EXPIRING';
    return 'NORMAL';
  }

  private calculateDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private sanitizeText(text: string): string {
    // Basic sanitization to prevent injection attacks
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes that could be used for SQL injection
      .substring(0, 255); // Ensure max length
  }
}