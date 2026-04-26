import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PHARMACY, Role.ADMIN)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  async createSale(@Body() createSaleDto: CreateSaleDto, @Req() req: Request) {
    const userId = (req.user as any)?.id || null;
    return this.salesService.createSale(createSaleDto, userId);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.salesService.findAll(pageNum, limitNum, startDate, endDate);
  }

  @Get('report/daily')
  async getDailyReport(@Query('date') date?: string) {
    return this.salesService.getDailyReport(date);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.salesService.findById(id);
  }

  @Get(':id/invoice')
  async getInvoice(@Param('id') id: string) {
    return this.salesService.generateInvoice(id);
  }
}