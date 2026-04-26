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
var PharmacyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PharmacyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const sales_service_1 = require("../sales/sales.service");
const client_1 = require("@prisma/client");
let PharmacyService = PharmacyService_1 = class PharmacyService {
    prisma;
    notificationsService;
    salesService;
    logger = new common_1.Logger(PharmacyService_1.name);
    constructor(prisma, notificationsService, salesService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.salesService = salesService;
    }
    async listPrescriptions(query, pharmacyUserId) {
        const { status, startDate, endDate, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = {
            targetPharmacyId: pharmacyUserId,
        };
        if (status) {
            where.status = status;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
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
    async dispensePrescription(prescriptionId, pharmacyUserId) {
        this.logger.log(`Dispensing prescription ${prescriptionId}`);
        const prescription = await this.prisma.prescription.findFirst({
            where: { id: prescriptionId, targetPharmacyId: pharmacyUserId },
            include: { patient: true },
        });
        if (!prescription) {
            throw new common_1.NotFoundException('Prescription not found');
        }
        if (prescription.status === 'DISPENSED') {
            throw new common_1.BadRequestException('Prescription is already dispensed');
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
        if (prescription.patient?.createdBy) {
        }
        if (prescription.patient?.email) {
            const patientUser = await this.prisma.user.findFirst({
                where: { email: prescription.patient.email },
            });
            if (patientUser) {
                await this.notificationsService.create(patientUser.id, 'PRESCRIPTION_DISPENSED', `Your prescription ${prescriptionId} has been dispensed and is ready for collection.`);
            }
        }
        return updated;
    }
    async listMedicines(query) {
        const { category, search, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = {};
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
    async addMedicine(dto, tenantId) {
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
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('A medicine with this batch number already exists');
            }
            this.logger.error(`Failed to add medicine: ${error.message}`);
            throw new common_1.BadRequestException('Failed to add medicine');
        }
    }
    async updateMedicine(id, dto) {
        this.logger.log(`Updating medicine: ${id}`);
        const existing = await this.prisma.medicine.findFirst({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Medicine not found');
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.category !== undefined)
            data.category = dto.category;
        if (dto.batchNumber !== undefined)
            data.batchNumber = dto.batchNumber;
        if (dto.expiryDate !== undefined)
            data.expiryDate = new Date(dto.expiryDate);
        if (dto.quantity !== undefined)
            data.quantity = dto.quantity;
        if (dto.supplier !== undefined)
            data.supplier = dto.supplier;
        if (dto.unitPrice !== undefined)
            data.unitPrice = dto.unitPrice;
        try {
            const updated = await this.prisma.medicine.update({
                where: { id },
                data,
            });
            return updated;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('A medicine with this batch number already exists');
            }
            throw error;
        }
    }
    async listInventory(query, tenantId) {
        const { search, stockStatus, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const LOW_STOCK_THRESHOLD = 10;
        const NEAR_EXPIRY_DAYS = 30;
        const where = { tenantId };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { batchNumber: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (stockStatus === 'LOW') {
            where.quantity = { lt: LOW_STOCK_THRESHOLD };
        }
        else if (stockStatus === 'NORMAL') {
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
        const nearExpiryDate = new Date(now.getTime() + NEAR_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        const data = medicines.map((m) => ({
            ...m,
            stockStatus: m.quantity < LOW_STOCK_THRESHOLD ? 'LOW' : 'NORMAL',
            nearExpiry: m.expiryDate <= nearExpiryDate,
        }));
        return { data, total, page, limit };
    }
    async getInventoryAlerts(tenantId) {
        const LOW_STOCK_THRESHOLD = 10;
        const NEAR_EXPIRY_DAYS = 30;
        const now = new Date();
        const nearExpiryDate = new Date(now.getTime() + NEAR_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
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
            lowStock: lowStock.map((m) => ({ ...m, stockStatus: 'LOW' })),
            nearExpiry: nearExpiry.map((m) => ({
                ...m,
                nearExpiry: true,
            })),
        };
    }
    async recordPurchase(dto, tenantId) {
        this.logger.log(`Recording purchase for medicine ${dto.medicineId}, batch: ${dto.batchNumber}`);
        const medicine = await this.prisma.medicine.findFirst({
            where: { id: dto.medicineId, tenantId },
        });
        if (!medicine) {
            throw new common_1.NotFoundException('Medicine not found');
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
    async listPurchases(query, tenantId) {
        const { startDate, endDate, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (startDate || endDate) {
            where.purchaseDate = {};
            if (startDate) {
                where.purchaseDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.purchaseDate.lte = new Date(endDate);
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
    async prescriptionCheckout(prescriptionId, pharmacyUserId) {
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
            throw new common_1.NotFoundException('Prescription not found');
        }
        const billItems = await Promise.all(prescription.items.map(async (item) => {
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
        }));
        return {
            prescriptionId: prescription.id,
            patientName: prescription.patient.name,
            doctorName: prescription.doctor.name,
            items: billItems,
            allAvailable: billItems.every((item) => item.available),
        };
    }
    async createSale(dto, userId) {
        const sale = await this.salesService.createSale(dto, userId);
        if (dto.prescriptionId) {
            await this.prisma.prescription.update({
                where: { id: dto.prescriptionId },
                data: { status: 'DISPENSED' },
            });
            this.logger.log(`Prescription ${dto.prescriptionId} marked as DISPENSED after sale ${sale.id}`);
        }
        return sale;
    }
    async getSaleDetail(id) {
        return this.salesService.findById(id);
    }
    async listSales(page = 1, limit = 20, startDate, endDate) {
        return this.salesService.findAll(page, limit, startDate, endDate);
    }
    async getInvoice(id) {
        return this.salesService.generateInvoice(id);
    }
    async sendBillToPatient(saleId) {
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
            throw new common_1.NotFoundException(`Sale ${saleId} not found`);
        }
        let patientUserId = null;
        if (sale.prescription?.patient?.email) {
            const patientUser = await this.prisma.user.findFirst({
                where: { email: sale.prescription.patient.email },
            });
            patientUserId = patientUser?.id ?? null;
        }
        if (!patientUserId) {
            throw new common_1.NotFoundException('No patient user account found to send the bill to');
        }
        const itemsSummary = sale.items
            .map((item) => `${item.medicine.name} x${item.quantity} - ${Number(item.totalPrice).toFixed(2)}`)
            .join(', ');
        await this.notificationsService.create(patientUserId, 'INVOICE', `Invoice for sale ${saleId}: ${itemsSummary}. Total: ${Number(sale.finalAmount).toFixed(2)}`);
        return { message: 'Bill sent to patient successfully', saleId };
    }
    async getDailyReport(tenantId, query) {
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
        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.finalAmount), 0);
        const totalItemsSold = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
        return {
            date: targetDate.toISOString().split('T')[0],
            totalSales,
            totalRevenue,
            totalItemsSold,
        };
    }
    async getTopMedicines(tenantId, query) {
        const where = { tenantId };
        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate) {
                where.createdAt.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.createdAt.lte = new Date(query.endDate);
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
        const medicineMap = new Map();
        for (const item of saleItems) {
            const existing = medicineMap.get(item.medicineId);
            if (existing) {
                existing.totalQuantity += item.quantity;
            }
            else {
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
    async getWeeklySummary(tenantId, query) {
        let startDate;
        let endDate;
        if (query.startDate && query.endDate) {
            startDate = new Date(query.startDate);
            endDate = new Date(query.endDate);
        }
        else {
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
        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.finalAmount), 0);
        const totalPurchaseCost = purchases.reduce((sum, purchase) => sum + Number(purchase.totalCost), 0);
        const netMargin = totalRevenue - totalPurchaseCost;
        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            totalRevenue,
            totalPurchaseCost,
            netMargin,
        };
    }
    async getPaymentBreakdown(tenantId, query) {
        const where = { tenantId };
        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate) {
                where.createdAt.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.createdAt.lte = new Date(query.endDate);
            }
        }
        const sales = await this.prisma.sale.findMany({ where });
        const breakdown = {
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
};
exports.PharmacyService = PharmacyService;
exports.PharmacyService = PharmacyService = PharmacyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        sales_service_1.SalesService])
], PharmacyService);
//# sourceMappingURL=pharmacy.service.js.map