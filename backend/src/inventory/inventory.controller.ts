import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { InventoryService } from './inventory.service';
import {
  CreateMedicineDto,
  UpdateMedicineDto,
  MedicineResponseDto,
  PaginatedMedicinesResponseDto,
  InventoryFilterDto,
  BulkUpdateStockDto,
} from './dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DOCTOR, Role.ADMIN, Role.PHARMACY)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMedicine(
    @Body(ValidationPipe) createMedicineDto: CreateMedicineDto,
  ): Promise<MedicineResponseDto> {
    return this.inventoryService.createMedicine(createMedicineDto);
  }

  @Get(':id')
  async getMedicine(@Param('id') id: string): Promise<MedicineResponseDto> {
    return this.inventoryService.findMedicineById(id);
  }

  @Put(':id')
  async updateMedicine(
    @Param('id') id: string,
    @Body(ValidationPipe) updateMedicineDto: UpdateMedicineDto,
  ): Promise<MedicineResponseDto> {
    return this.inventoryService.updateMedicine(id, updateMedicineDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMedicine(@Param('id') id: string): Promise<void> {
    return this.inventoryService.deleteMedicine(id);
  }

  @Get()
  async getMedicines(
    @Query(ValidationPipe) filterDto: InventoryFilterDto,
  ): Promise<PaginatedMedicinesResponseDto> {
    return this.inventoryService.findAllMedicines(filterDto);
  }

  @Put('bulk-update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.PHARMACY) // Restrict bulk updates to admin and pharmacy roles
  async bulkUpdateStock(
    @Body(ValidationPipe) bulkUpdateDto: BulkUpdateStockDto,
  ): Promise<void> {
    return this.inventoryService.bulkUpdateStock(bulkUpdateDto);
  }
}