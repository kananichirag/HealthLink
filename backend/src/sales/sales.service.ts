import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { SalePaymentMethod, DiscountType } from '@prisma/client';
import {
  CreateSaleDto,
  SaleResponseDto,
  SaleItemResponseDto,
  InvoiceResponseDto,
  DailySalesReportDto,
  PaymentMethodBreakdownDto,
} from './dto';
import { SaleNearExpiryMedicineEvent } from './events/sale.events';

@Injectable()
export class SalesService {
  private readonly pharmacyName: string;
  private readonly pharmacyAddress: string;
  private readonly nearExpiryThreshold = 30; // days

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.pharmacyName =
      this.configService.get<string>('pharmacy.name') || 'Pharmacy';
    this.pharmacyAddress =
      this.configService.get<string>('pharmacy.address') ||
      'Address not configured';
  }

  async createSale(dto: CreateSaleDto, userId: string | null): Promise<SaleResponseDto> {
    // Validate prescription if provided
    if (dto.prescriptionId) {
      const prescription = await this.prisma.prescription.findUnique({
        where: { id: dto.prescriptionId },
      });
      if (!prescription) {
        throw new NotFoundException(
          `Prescription ${dto.prescriptionId} not found`,
        );
      }
    }

    // Perform FIFO batch selection and stock deduction within transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const saleItemsWithBatch: Array<{
        medicineId: string;
        batchNumber: string;
        quantity: number;
        pricePerUnit: number;
        totalPrice: number;
      }> = [];

      // FIFO batch selection for each item
      for (const item of dto.items) {
        // Find all non-expired batches for this medicine, ordered by expiry date (FIFO)
        const availableBatches = await tx.medicine.findMany({
          where: {
            id: item.medicineId,
            expiryDate: { gt: new Date() }, // Non-expired only
            quantity: { gte: item.quantity }, // Sufficient stock only
          },
          orderBy: { expiryDate: 'asc' }, // FIFO: oldest first
          take: 1, // We only need the first (oldest) suitable batch
        });

        if (availableBatches.length === 0) {
          // Check if medicine exists at all
          const medicine = await tx.medicine.findUnique({
            where: { id: item.medicineId },
            select: { name: true, quantity: true, expiryDate: true },
          });

          if (!medicine) {
            throw new NotFoundException(`Medicine ${item.medicineId} not found`);
          }

          const isExpired = medicine.expiryDate <= new Date();
          const reason = isExpired ? 'expired' : 'insufficient stock';
          throw new UnprocessableEntityException(
            `Cannot fulfill request for ${medicine.name}: ${reason}`,
          );
        }

        const selectedBatch = availableBatches[0];

        // Atomically deduct stock
        await tx.medicine.update({
          where: { id: selectedBatch.id },
          data: { quantity: { decrement: item.quantity } },
        });

        // Store the selected batch info for sale item creation
        saleItemsWithBatch.push({
          medicineId: item.medicineId,
          batchNumber: selectedBatch.batchNumber,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          totalPrice: item.pricePerUnit * item.quantity,
        });
      }

      // Calculate financial totals
      const financials = this.calculateFinancials(
        saleItemsWithBatch,
        dto.discount || 0,
        dto.discountType || DiscountType.FLAT,
        dto.taxRate || 0,
      );

      // Create sale record
      const sale = await tx.sale.create({
        data: {
          customerName: dto.customerName,
          prescriptionId: dto.prescriptionId,
          paymentMethod: dto.paymentMethod,
          discountType: dto.discountType || DiscountType.FLAT,
          subtotal: financials.subtotal,
          discount: financials.discountAmount,
          tax: financials.taxAmount,
          finalAmount: financials.finalAmount,
          createdBy: userId || undefined,
        },
        include: {
          items: {
            include: {
              medicine: {
                select: { name: true },
              },
            },
          },
        },
      });

      // Create sale items
      await tx.saleItem.createMany({
        data: saleItemsWithBatch.map((item) => ({
          saleId: sale.id,
          ...item,
        })),
      });

      return { sale, saleItemsWithBatch };
    });

    // Emit near-expiry events after transaction commits
    await this.emitNearExpiryEvents(
      result.sale.id,
      result.sale.customerName,
      result.saleItemsWithBatch,
    );

    // Return formatted response
    return this.formatSaleResponse(result.sale);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    startDate?: string,
    endDate?: string,
  ): Promise<{ sales: SaleResponseDto[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      sales: sales.map((sale) => ({
        ...this.formatSaleResponse(sale),
        itemCount: sale.items.length,
      })),
      total,
    };
  }

  async findById(id: string): Promise<SaleResponseDto> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            medicine: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${id} not found`);
    }

    return this.formatSaleResponse(sale);
  }

  async generateInvoice(id: string): Promise<InvoiceResponseDto> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            medicine: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${id} not found`);
    }

    return {
      pharmacyName: this.pharmacyName,
      pharmacyAddress: this.pharmacyAddress,
      invoiceNumber: sale.id,
      invoiceDate: sale.createdAt.toISOString(),
      customerName: sale.customerName,
      paymentMethod: sale.paymentMethod,
      items: sale.items.map((item) => ({
        medicineName: item.medicine.name,
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        pricePerUnit: Number(item.pricePerUnit),
        totalPrice: Number(item.totalPrice),
      })),
      subtotal: Number(sale.subtotal),
      discountAmount: Number(sale.discount),
      taxAmount: Number(sale.tax),
      finalAmount: Number(sale.finalAmount),
    };
  }

  async getDailyReport(date?: string): Promise<DailySalesReportDto> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        items: true,
      },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.finalAmount),
      0,
    );
    const totalItemsSold = sales.reduce(
      (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );

    // Calculate payment method breakdown
    const paymentMethodBreakdown = {
      CASH: { count: 0, revenue: 0 },
      CARD: { count: 0, revenue: 0 },
      ONLINE: { count: 0, revenue: 0 },
    };

    sales.forEach((sale) => {
      const method = sale.paymentMethod as keyof typeof paymentMethodBreakdown;
      paymentMethodBreakdown[method].count++;
      paymentMethodBreakdown[method].revenue += Number(sale.finalAmount);
    });

    return {
      date: targetDate.toISOString().split('T')[0],
      totalSales,
      totalRevenue,
      totalItemsSold,
      paymentMethodBreakdown,
    };
  }

  private calculateFinancials(
    items: Array<{ pricePerUnit: number; quantity: number }>,
    discount: number,
    discountType: DiscountType,
    taxRate: number,
  ) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.pricePerUnit * item.quantity,
      0,
    );

    const discountAmount =
      discountType === DiscountType.PERCENTAGE
        ? Math.round(subtotal * (discount / 100) * 100) / 100
        : discount;

    if (discountAmount > subtotal) {
      throw new UnprocessableEntityException(
        `Discount amount (${discountAmount}) exceeds subtotal (${subtotal})`,
      );
    }

    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount =
      Math.round(discountedSubtotal * (taxRate / 100) * 100) / 100;
    const finalAmount =
      Math.round((discountedSubtotal + taxAmount) * 100) / 100;

    return { subtotal, discountAmount, taxAmount, finalAmount };
  }

  private async emitNearExpiryEvents(
    saleId: string,
    customerName: string,
    saleItems: Array<{ medicineId: string; batchNumber: string }>,
  ) {
    const nearExpiryDate = new Date();
    nearExpiryDate.setDate(nearExpiryDate.getDate() + this.nearExpiryThreshold);

    for (const item of saleItems) {
      const medicine = await this.prisma.medicine.findUnique({
        where: { id: item.medicineId },
        select: { name: true, expiryDate: true },
      });

      if (medicine && medicine.expiryDate <= nearExpiryDate) {
        const event: SaleNearExpiryMedicineEvent = {
          medicineId: item.medicineId,
          medicineName: medicine.name,
          batchNumber: item.batchNumber,
          expiryDate: medicine.expiryDate,
          saleId,
          customerName,
        };

        this.eventEmitter.emit('sale.near_expiry_medicine', event);
      }
    }
  }

  private formatSaleResponse(sale: any): SaleResponseDto {
    return {
      id: sale.id,
      customerName: sale.customerName,
      prescriptionId: sale.prescriptionId,
      paymentMethod: sale.paymentMethod,
      discountType: sale.discountType,
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      tax: Number(sale.tax),
      finalAmount: Number(sale.finalAmount),
      createdBy: sale.createdBy,
      createdAt: sale.createdAt.toISOString(),
      items: sale.items?.map((item: any) => ({
        id: item.id,
        saleId: item.saleId,
        medicineId: item.medicineId,
        medicineName: item.medicine?.name,
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        pricePerUnit: Number(item.pricePerUnit),
        totalPrice: Number(item.totalPrice),
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}