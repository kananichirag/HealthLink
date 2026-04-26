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
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const order_events_1 = require("./events/order.events");
const client_1 = require("@prisma/client");
let OrdersService = OrdersService_1 = class OrdersService {
    prisma;
    eventEmitter;
    logger = new common_1.Logger(OrdersService_1.name);
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async createOrder(dto, pharmacyId) {
        this.logger.log(`Creating order for prescription ${dto.prescriptionId} by pharmacy ${pharmacyId}`);
        const prescription = await this.prisma.prescription.findUnique({
            where: { id: dto.prescriptionId },
            include: { patient: { select: { id: true } } },
        });
        if (!prescription) {
            throw new common_1.NotFoundException(`Prescription with ID ${dto.prescriptionId} not found`);
        }
        if (prescription.status !== client_1.PrescriptionStatus.PENDING) {
            throw new common_1.UnprocessableEntityException(`Prescription is not eligible for order creation. Current status: ${prescription.status}`);
        }
        const order = await this.prisma.$transaction(async (tx) => {
            const created = await tx.order.create({
                data: {
                    prescription: { connect: { id: dto.prescriptionId } },
                    pharmacy: { connect: { id: pharmacyId } },
                    status: client_1.OrderStatus.PENDING,
                },
                include: {
                    prescription: {
                        select: { id: true, patientId: true, doctorId: true, status: true },
                    },
                    pharmacy: { select: { id: true, name: true } },
                },
            });
            await tx.prescription.update({
                where: { id: dto.prescriptionId },
                data: { status: client_1.PrescriptionStatus.DISPENSED },
            });
            return created;
        }, { timeout: 30000 });
        const payload = {
            orderId: order.id,
            prescriptionId: order.prescriptionId,
            patientId: prescription.patientId,
            pharmacyId,
            newStatus: client_1.OrderStatus.PENDING,
            trackingInfo: null,
        };
        this.eventEmitter.emit(order_events_1.ORDER_STATUS_UPDATED, payload);
        return this.toResponseDto(order);
    }
    async findAll(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [total, orders] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.order.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    prescription: {
                        select: { id: true, patientId: true, doctorId: true, status: true },
                    },
                    pharmacy: { select: { id: true, name: true } },
                },
            }),
        ]);
        return {
            data: orders.map((o) => this.toResponseDto(o)),
            total,
            page,
            limit,
        };
    }
    async findById(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                prescription: {
                    select: { id: true, patientId: true, doctorId: true, status: true },
                },
                pharmacy: { select: { id: true, name: true } },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order with ID ${id} not found`);
        }
        return this.toResponseDto(order);
    }
    async updateStatus(id, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                prescription: { select: { patientId: true } },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order with ID ${id} not found`);
        }
        const updated = await this.prisma.order.update({
            where: { id },
            data: {
                status: dto.status,
                ...(dto.trackingInfo !== undefined && { trackingInfo: dto.trackingInfo }),
            },
            include: {
                prescription: {
                    select: { id: true, patientId: true, doctorId: true, status: true },
                },
                pharmacy: { select: { id: true, name: true } },
            },
        });
        if (dto.status === client_1.OrderStatus.SHIPPED || dto.status === client_1.OrderStatus.DELIVERED) {
            const payload = {
                orderId: updated.id,
                prescriptionId: updated.prescriptionId,
                patientId: order.prescription.patientId,
                pharmacyId: updated.pharmacyId,
                newStatus: dto.status,
                trackingInfo: updated.trackingInfo,
            };
            this.eventEmitter.emit(order_events_1.ORDER_STATUS_UPDATED, payload);
        }
        return this.toResponseDto(updated);
    }
    toResponseDto(order) {
        return {
            id: order.id,
            prescriptionId: order.prescriptionId,
            pharmacyId: order.pharmacyId,
            status: order.status,
            trackingInfo: order.trackingInfo,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            prescription: order.prescription,
            pharmacy: order.pharmacy,
        };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], OrdersService);
//# sourceMappingURL=orders.service.js.map