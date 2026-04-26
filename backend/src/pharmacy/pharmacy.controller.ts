import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PharmacyService } from './pharmacy.service';
import {
  PrescriptionQueryDto,
  MedicineQueryDto,
  AddMedicineDto,
  UpdateMedicineDto,
  RecordPurchaseDto,
  PurchaseQueryDto,
  InventoryQueryDto,
  PrescriptionCheckoutDto,
  ReportQueryDto,
} from './dto';
import { CreateSaleDto } from '../sales/dto';

@Controller('pharmacy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PHARMACY)
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Get('prescriptions')
  async listPrescriptions(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: PrescriptionQueryDto,
    @Request() req: any,
  ) {
    return this.pharmacyService.listPrescriptions(query, req.user.sub);
  }

  @Patch('prescriptions/:id/dispense')
  @HttpCode(HttpStatus.OK)
  async dispensePrescription(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.pharmacyService.dispensePrescription(id, req.user.sub);
  }

  @Get('medicines')
  async listMedicines(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: MedicineQueryDto,
  ) {
    return this.pharmacyService.listMedicines(query);
  }

  @Post('medicines')
  @HttpCode(HttpStatus.CREATED)
  async addMedicine(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: AddMedicineDto,
    @Request() req: any,
  ) {
    return this.pharmacyService.addMedicine(dto, req.user.tenantId);
  }

  @Put('medicines/:id')
  async updateMedicine(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdateMedicineDto,
  ) {
    return this.pharmacyService.updateMedicine(id, dto);
  }

  // ─── Inventory ───

  @Get('inventory')
  async listInventory(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: InventoryQueryDto,
    @Request() req: any,
  ) {
    return this.pharmacyService.listInventory(query, req.user.tenantId);
  }

  @Get('inventory/alerts')
  async getInventoryAlerts(@Request() req: any) {
    return this.pharmacyService.getInventoryAlerts(req.user.tenantId);
  }

  // ─── Purchases ───

  @Post('purchases')
  @HttpCode(HttpStatus.CREATED)
  async recordPurchase(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: RecordPurchaseDto,
    @Request() req: any,
  ) {
    return this.pharmacyService.recordPurchase(dto, req.user.tenantId);
  }

  @Get('purchases')
  async listPurchases(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: PurchaseQueryDto,
    @Request() req: any,
  ) {
    return this.pharmacyService.listPurchases(query, req.user.tenantId);
  }

  // ─── Reports ───

  @Get('reports/daily')
  async getDailyReport(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: ReportQueryDto,
    @Request() req: any,
  ) {
    return this.pharmacyService.getDailyReport(req.user.tenantId, query);
  }

  @Get('reports/top-medicines')
  async getTopMedicines(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: ReportQueryDto,
    @Request() req: any,
  ) {
    return this.pharmacyService.getTopMedicines(req.user.tenantId, query);
  }

  @Get('reports/weekly-summary')
  async getWeeklySummary(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: ReportQueryDto,
    @Request() req: any,
  ) {
    return this.pharmacyService.getWeeklySummary(req.user.tenantId, query);
  }

  @Get('reports/payment-breakdown')
  async getPaymentBreakdown(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: ReportQueryDto,
    @Request() req: any,
  ) {
    return this.pharmacyService.getPaymentBreakdown(req.user.tenantId, query);
  }

  // ─── Sales ───

  @Post('sales/prescription-checkout')
  @HttpCode(HttpStatus.OK)
  async prescriptionCheckout(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: PrescriptionCheckoutDto,
    @Request() req: any,
  ) {
    return this.pharmacyService.prescriptionCheckout(
      dto.prescriptionId,
      req.user.sub,
    );
  }

  @Post('sales')
  @HttpCode(HttpStatus.CREATED)
  async createSale(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CreateSaleDto,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || null;
    return this.pharmacyService.createSale(dto, userId);
  }

  @Get('sales')
  async listSales(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.pharmacyService.listSales(pageNum, limitNum, startDate, endDate);
  }

  @Get('sales/:id')
  async getSaleDetail(@Param('id') id: string) {
    return this.pharmacyService.getSaleDetail(id);
  }

  @Get('sales/:id/invoice')
  async getInvoice(@Param('id') id: string) {
    return this.pharmacyService.getInvoice(id);
  }

  @Post('sales/:id/send-bill')
  @HttpCode(HttpStatus.OK)
  async sendBillToPatient(@Param('id') id: string) {
    return this.pharmacyService.sendBillToPatient(id);
  }
}
