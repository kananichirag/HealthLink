import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SalesService } from '../sales/sales.service';
import {
  PrescriptionQueryDto,
  MedicineQueryDto,
  AddMedicineDto,
  UpdateMedicineDto,
  RecordPurchaseDto,
  PurchaseQueryDto,
  InventoryQueryDto,
  ReportQueryDto,
} from './dto';
import { CreateSaleDto } from '../sales/dto';
import { Prisma, ConnectionStatus } from '@prisma/client';

@Injectable()
export class PharmacyService {
  private readonly logger = new Logger(PharmacyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly salesService: SalesService,
  ) {}

  async listPrescriptions(query: PrescriptionQueryDto, pharmacyUserId: string) {
    const { status, startDate, endDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PrescriptionWhereInput = {
      targetPharmacyId: pharmacyUserId,
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Prisma.DateTimeFilter).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Prisma.DateTimeFilter).lte = new Date(endDate);
      }
    }

    const [total, prescriptions] = await Promise.all([
      this.prisma.prescription.count({ where }),
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, name: true } },
          doctor: { select: { id: true, name: true } },
          items: {
            include: {
              medicine: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return { data: prescriptions, total, page, limit };
  }

  async listDoctorConnections(pharmacyUserId: string, status?: ConnectionStatus) {
    const where: Prisma.DoctorPharmacyConnectionWhereInput = {
      pharmacyId: pharmacyUserId,
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.doctorPharmacyConnection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async dispensePrescription(prescriptionId: string, pharmacyUserId: string) {
    this.logger.log(`Dispensing prescription ${prescriptionId}`);

    const prescription = await this.prisma.prescription.findFirst({
      where: { id: prescriptionId, targetPharmacyId: pharmacyUserId },
      include: { patient: true },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.status === 'DISPENSED') {
      throw new BadRequestException('Prescription is already dispensed');
    }

    const updated = await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: 'DISPENSED' },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
        items: {
          include: {
            medicine: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Notify the patient
    if (prescription.patient?.createdBy) {
      // The patient model has createdBy which is the user who created the patient record
      // We need to find the user associated with this patient to send notification
      // Since Patient doesn't have a userId, we notify via the patient's creator or
      // look for a user with matching email
    }

    // Create notification for the patient's associated user (if any)
    // The patient record is linked to a creator (doctor), but the patient themselves
    // may have a user account. We'll try to find a user with the patient's email.
    if (prescription.patient?.email) {
      const patientUser = await this.prisma.user.findFirst({
        where: { email: prescription.patient.email },
      });
      if (patientUser) {
        await this.notificationsService.create(
          patientUser.id,
          'PRESCRIPTION_DISPENSED',
          `Your prescription ${prescriptionId} has been dispensed and is ready for collection.`,
        );
      }
    }

    return updated;
  }

  async listMedicines(query: MedicineQueryDto) {
    const { category, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MedicineWhereInput = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
      ];
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

    return { data: medicines, total, page, limit };
  }

  async addMedicine(dto: AddMedicineDto, tenantId: string) {
    this.logger.log(`Adding medicine: ${dto.name}, batch: ${dto.batchNumber}`);

    try {
      const medicine = await this.prisma.medicine.create({
        data: {
          name: dto.name,
          category: dto.category ?? null,
          batchNumber: dto.batchNumber,
          expiryDate: new Date(dto.expiryDate),
          quantity: dto.quantity,
          supplier: dto.supplier,
          unitPrice: dto.unitPrice ?? null,
          tenantId,
        },
      });
      return medicine;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A medicine with this batch number already exists',
        );
      }
      this.logger.error(`Failed to add medicine: ${error.message}`);
      throw new BadRequestException('Failed to add medicine');
    }
  }

  async updateMedicine(id: string, dto: UpdateMedicineDto) {
    this.logger.log(`Updating medicine: ${id}`);

    const existing = await this.prisma.medicine.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Medicine not found');
    }

    const data: Prisma.MedicineUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.batchNumber !== undefined) data.batchNumber = dto.batchNumber;
    if (dto.expiryDate !== undefined) data.expiryDate = new Date(dto.expiryDate);
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.supplier !== undefined) data.supplier = dto.supplier;
    if (dto.unitPrice !== undefined) data.unitPrice = dto.unitPrice;

    try {
      const updated = await this.prisma.medicine.update({
        where: { id },
        data,
      });
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A medicine with this batch number already exists',
        );
      }
      throw error;
    }
  }

  // ─── Inventory ───

  async listInventory(query: InventoryQueryDto, tenantId: string) {
    const { search, stockStatus, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const LOW_STOCK_THRESHOLD = 10;
    const NEAR_EXPIRY_DAYS = 30;

    const where: Prisma.MedicineWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (stockStatus === 'LOW') {
      where.quantity = { lt: LOW_STOCK_THRESHOLD };
    } else if (stockStatus === 'NORMAL') {
      where.quantity = { gte: LOW_STOCK_THRESHOLD };
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

    const now = new Date();
    const nearExpiryDate = new Date(
      now.getTime() + NEAR_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    const data = medicines.map((m) => ({
      ...m,
      stockStatus: m.quantity < LOW_STOCK_THRESHOLD ? 'LOW' : 'NORMAL',
      nearExpiry: m.expiryDate <= nearExpiryDate,
    }));

    return { data, total, page, limit };
  }

  async getInventoryAlerts(tenantId: string) {
    const LOW_STOCK_THRESHOLD = 10;
    const NEAR_EXPIRY_DAYS = 30;
    const now = new Date();
    const nearExpiryDate = new Date(
      now.getTime() + NEAR_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    const [lowStock, nearExpiry] = await Promise.all([
      this.prisma.medicine.findMany({
        where: { tenantId, quantity: { lt: LOW_STOCK_THRESHOLD } },
        orderBy: { quantity: 'asc' },
      }),
      this.prisma.medicine.findMany({
        where: {
          tenantId,
          expiryDate: { lte: nearExpiryDate },
        },
        orderBy: { expiryDate: 'asc' },
      }),
    ]);

    return {
      lowStock: lowStock.map((m) => ({ ...m, stockStatus: 'LOW' as const })),
      nearExpiry: nearExpiry.map((m) => ({
        ...m,
        nearExpiry: true,
      })),
    };
  }

  // ─── Purchases ───

  async recordPurchase(dto: RecordPurchaseDto, tenantId: string) {
    this.logger.log(
      `Recording purchase for medicine ${dto.medicineId}, batch: ${dto.batchNumber}`,
    );

    const medicine = await this.prisma.medicine.findFirst({
      where: { id: dto.medicineId, tenantId },
    });

    if (!medicine) {
      throw new NotFoundException('Medicine not found');
    }

    const totalCost = dto.quantity * dto.unitCost;

    const [purchase] = await this.prisma.$transaction([
      this.prisma.purchaseRecord.create({
        data: {
          medicineId: dto.medicineId,
          batchNumber: dto.batchNumber,
          quantity: dto.quantity,
          unitCost: dto.unitCost,
          totalCost,
          sellerName: dto.sellerName,
          sellerCompany: dto.sellerCompany,
          purchaseDate: new Date(dto.purchaseDate),
          tenantId,
        },
      }),
      this.prisma.medicine.update({
        where: { id: dto.medicineId },
        data: { quantity: { increment: dto.quantity } },
      }),
    ]);

    return purchase;
  }

  async listPurchases(query: PurchaseQueryDto, tenantId: string) {
    const { startDate, endDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseRecordWhereInput = { tenantId };

    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) {
        (where.purchaseDate as Prisma.DateTimeFilter).gte = new Date(startDate);
      }
      if (endDate) {
        (where.purchaseDate as Prisma.DateTimeFilter).lte = new Date(endDate);
      }
    }

    const [total, purchases] = await Promise.all([
      this.prisma.purchaseRecord.count({ where }),
      this.prisma.purchaseRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { purchaseDate: 'desc' },
        include: {
          medicine: { select: { id: true, name: true } },
        },
      }),
    ]);

    return { data: purchases, total, page, limit };
  }

  // ─── Sales ───

  async prescriptionCheckout(prescriptionId: string, pharmacyUserId: string) {
    this.logger.log(`Prescription checkout for ${prescriptionId}`);

    const prescription = await this.prisma.prescription.findFirst({
      where: { id: prescriptionId, targetPharmacyId: pharmacyUserId },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
        items: {
          include: {
            medicine: { select: { id: true, name: true, unitPrice: true } },
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Match each prescribed medicine to available inventory
    const billItems = await Promise.all(
      prescription.items.map(async (item) => {
        const inventoryMatch = await this.prisma.medicine.findFirst({
          where: {
            name: item.medicine.name,
            quantity: { gt: 0 },
            expiryDate: { gt: new Date() },
          },
          orderBy: { expiryDate: 'asc' },
        });

        return {
          prescriptionItemId: item.id,
          medicineId: inventoryMatch?.id ?? item.medicineId,
          medicineName: item.medicine.name,
          prescribedQuantity: item.quantity,
          availableQuantity: inventoryMatch?.quantity ?? 0,
          available: !!inventoryMatch && inventoryMatch.quantity >= item.quantity,
          pricePerUnit: inventoryMatch
            ? Number(inventoryMatch.unitPrice ?? 0)
            : Number(item.medicine.unitPrice ?? 0),
          batchNumber: inventoryMatch?.batchNumber ?? null,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
        };
      }),
    );

    return {
      prescriptionId: prescription.id,
      patientName: prescription.patient.name,
      doctorName: prescription.doctor.name,
      items: billItems,
      allAvailable: billItems.every((item) => item.available),
    };
  }

  async createSale(dto: CreateSaleDto, userId: string | null) {
    const sale = await this.salesService.createSale(dto, userId);

    // If this sale is linked to a prescription, update prescription status to DISPENSED
    if (dto.prescriptionId) {
      await this.prisma.prescription.update({
        where: { id: dto.prescriptionId },
        data: { status: 'DISPENSED' },
      });
      this.logger.log(
        `Prescription ${dto.prescriptionId} marked as DISPENSED after sale ${sale.id}`,
      );
    }

    return sale;
  }

  async getSaleDetail(id: string) {
    return this.salesService.findById(id);
  }

  async listSales(
    page: number = 1,
    limit: number = 20,
    startDate?: string,
    endDate?: string,
  ) {
    return this.salesService.findAll(page, limit, startDate, endDate);
  }

  async getInvoice(id: string) {
    return this.salesService.generateInvoice(id);
  }

  async sendBillToPatient(saleId: string) {
    this.logger.log(`Sending bill for sale ${saleId} to patient`);

    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        prescription: {
          include: {
            patient: { select: { id: true, name: true, email: true } },
          },
        },
        items: {
          include: {
            medicine: { select: { name: true } },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${saleId} not found`);
    }

    // Find the patient user to send notification
    let patientUserId: string | null = null;

    if (sale.prescription?.patient?.email) {
      const patientUser = await this.prisma.user.findFirst({
        where: { email: sale.prescription.patient.email },
      });
      patientUserId = patientUser?.id ?? null;
    }

    if (!patientUserId) {
      throw new NotFoundException(
        'No patient user account found to send the bill to',
      );
    }

    const itemsSummary = sale.items
      .map(
        (item) =>
          `${item.medicine.name} x${item.quantity} - ${Number(item.totalPrice).toFixed(2)}`,
      )
      .join(', ');

    await this.notificationsService.create(
      patientUserId,
      'INVOICE',
      `Invoice for sale ${saleId}: ${itemsSummary}. Total: ${Number(sale.finalAmount).toFixed(2)}`,
    );

    return { message: 'Bill sent to patient successfully', saleId };
  }

  // ─── Reports ───

  async getDailyReport(tenantId: string, query: ReportQueryDto) {
    const targetDate = query.startDate ? new Date(query.startDate) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      include: { items: true },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.finalAmount),
      0,
    );
    const totalItemsSold = sales.reduce(
      (sum, sale) =>
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );

    return {
      date: targetDate.toISOString().split('T')[0],
      totalSales,
      totalRevenue,
      totalItemsSold,
    };
  }

  async getTopMedicines(tenantId: string, query: ReportQueryDto) {
    const where: Prisma.SaleItemWhereInput = { tenantId };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        (where.createdAt as Prisma.DateTimeFilter).gte = new Date(
          query.startDate,
        );
      }
      if (query.endDate) {
        (where.createdAt as Prisma.DateTimeFilter).lte = new Date(
          query.endDate,
        );
      }
    }

    const saleItems = await this.prisma.saleItem.findMany({
      where,
      select: {
        medicineId: true,
        quantity: true,
        medicine: { select: { id: true, name: true } },
      },
    });

    const medicineMap = new Map<
      string,
      { medicineId: string; medicineName: string; totalQuantity: number }
    >();

    for (const item of saleItems) {
      const existing = medicineMap.get(item.medicineId);
      if (existing) {
        existing.totalQuantity += item.quantity;
      } else {
        medicineMap.set(item.medicineId, {
          medicineId: item.medicineId,
          medicineName: item.medicine.name,
          totalQuantity: item.quantity,
        });
      }
    }

    const sorted = Array.from(medicineMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    return sorted;
  }

  async getWeeklySummary(tenantId: string, query: ReportQueryDto) {
    let startDate: Date;
    let endDate: Date;

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      // Default to current week (Monday to Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - diffToMonday);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    const [sales, purchases] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.purchaseRecord.findMany({
        where: {
          tenantId,
          purchaseDate: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const totalRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.finalAmount),
      0,
    );
    const totalPurchaseCost = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.totalCost),
      0,
    );
    const netMargin = totalRevenue - totalPurchaseCost;

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalRevenue,
      totalPurchaseCost,
      netMargin,
    };
  }

  async getPaymentBreakdown(tenantId: string, query: ReportQueryDto) {
    const where: Prisma.SaleWhereInput = { tenantId };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        (where.createdAt as Prisma.DateTimeFilter).gte = new Date(
          query.startDate,
        );
      }
      if (query.endDate) {
        (where.createdAt as Prisma.DateTimeFilter).lte = new Date(
          query.endDate,
        );
      }
    }

    const sales = await this.prisma.sale.findMany({ where });

    const breakdown: Record<string, { count: number; revenue: number }> = {
      CASH: { count: 0, revenue: 0 },
      CARD: { count: 0, revenue: 0 },
      ONLINE: { count: 0, revenue: 0 },
    };

    for (const sale of sales) {
      const method = sale.paymentMethod;
      breakdown[method].count++;
      breakdown[method].revenue += Number(sale.finalAmount);
    }

    return breakdown;
  }
}
