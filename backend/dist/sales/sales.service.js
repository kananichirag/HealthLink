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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SalesService = class SalesService {
    prisma;
    configService;
    eventEmitter;
    pharmacyName;
    pharmacyAddress;
    nearExpiryThreshold = 30;
    constructor(prisma, configService, eventEmitter) {
        this.prisma = prisma;
        this.configService = configService;
        this.eventEmitter = eventEmitter;
        this.pharmacyName =
            this.configService.get('pharmacy.name') || 'Pharmacy';
        this.pharmacyAddress =
            this.configService.get('pharmacy.address') ||
                'Address not configured';
    }
    async createSale(dto, userId) {
        if (dto.prescriptionId) {
            const prescription = await this.prisma.prescription.findUnique({
                where: { id: dto.prescriptionId },
            });
            if (!prescription) {
                throw new common_1.NotFoundException(`Prescription ${dto.prescriptionId} not found`);
            }
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const saleItemsWithBatch = [];
            for (const item of dto.items) {
                const availableBatches = await tx.medicine.findMany({
                    where: {
                        id: item.medicineId,
                        expiryDate: { gt: new Date() },
                        quantity: { gte: item.quantity },
                    },
                    orderBy: { expiryDate: 'asc' },
                    take: 1,
                });
                if (availableBatches.length === 0) {
                    const medicine = await tx.medicine.findUnique({
                        where: { id: item.medicineId },
                        select: { name: true, quantity: true, expiryDate: true },
                    });
                    if (!medicine) {
                        throw new common_1.NotFoundException(`Medicine ${item.medicineId} not found`);
                    }
                    const isExpired = medicine.expiryDate <= new Date();
                    const reason = isExpired ? 'expired' : 'insufficient stock';
                    throw new common_1.UnprocessableEntityException(`Cannot fulfill request for ${medicine.name}: ${reason}`);
                }
                const selectedBatch = availableBatches[0];
                await tx.medicine.update({
                    where: { id: selectedBatch.id },
                    data: { quantity: { decrement: item.quantity } },
                });
                saleItemsWithBatch.push({
                    medicineId: item.medicineId,
                    batchNumber: selectedBatch.batchNumber,
                    quantity: item.quantity,
                    pricePerUnit: item.pricePerUnit,
                    totalPrice: item.pricePerUnit * item.quantity,
                });
            }
            const financials = this.calculateFinancials(saleItemsWithBatch, dto.discount || 0, dto.discountType || client_1.DiscountType.FLAT, dto.taxRate || 0);
            const sale = await tx.sale.create({
                data: {
                    customerName: dto.customerName,
                    prescriptionId: dto.prescriptionId,
                    paymentMethod: dto.paymentMethod,
                    discountType: dto.discountType || client_1.DiscountType.FLAT,
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
            await tx.saleItem.createMany({
                data: saleItemsWithBatch.map((item) => ({
                    saleId: sale.id,
                    ...item,
                })),
            });
            return { sale, saleItemsWithBatch };
        });
        await this.emitNearExpiryEvents(result.sale.id, result.sale.customerName, result.saleItemsWithBatch);
        return this.formatSaleResponse(result.sale);
    }
    async findAll(page = 1, limit = 20, startDate, endDate) {
        const skip = (page - 1) * limit;
        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
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
    async findById(id) {
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
            throw new common_1.NotFoundException(`Sale ${id} not found`);
        }
        return this.formatSaleResponse(sale);
    }
    async generateInvoice(id) {
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
            throw new common_1.NotFoundException(`Sale ${id} not found`);
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
    async getDailyReport(date) {
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
        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.finalAmount), 0);
        const totalItemsSold = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
        const paymentMethodBreakdown = {
            CASH: { count: 0, revenue: 0 },
            CARD: { count: 0, revenue: 0 },
            ONLINE: { count: 0, revenue: 0 },
        };
        sales.forEach((sale) => {
            const method = sale.paymentMethod;
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
    calculateFinancials(items, discount, discountType, taxRate) {
        const subtotal = items.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);
        const discountAmount = discountType === client_1.DiscountType.PERCENTAGE
            ? Math.round(subtotal * (discount / 100) * 100) / 100
            : discount;
        if (discountAmount > subtotal) {
            throw new common_1.UnprocessableEntityException(`Discount amount (${discountAmount}) exceeds subtotal (${subtotal})`);
        }
        const discountedSubtotal = subtotal - discountAmount;
        const taxAmount = Math.round(discountedSubtotal * (taxRate / 100) * 100) / 100;
        const finalAmount = Math.round((discountedSubtotal + taxAmount) * 100) / 100;
        return { subtotal, discountAmount, taxAmount, finalAmount };
    }
    async emitNearExpiryEvents(saleId, customerName, saleItems) {
        const nearExpiryDate = new Date();
        nearExpiryDate.setDate(nearExpiryDate.getDate() + this.nearExpiryThreshold);
        for (const item of saleItems) {
            const medicine = await this.prisma.medicine.findUnique({
                where: { id: item.medicineId },
                select: { name: true, expiryDate: true },
            });
            if (medicine && medicine.expiryDate <= nearExpiryDate) {
                const event = {
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
    formatSaleResponse(sale) {
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
            items: sale.items?.map((item) => ({
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
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        event_emitter_1.EventEmitter2])
], SalesService);
//# sourceMappingURL=sales.service.js.map