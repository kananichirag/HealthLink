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
var PrescriptionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const prescription_events_1 = require("./events/prescription.events");
const client_1 = require("@prisma/client");
let PrescriptionsService = PrescriptionsService_1 = class PrescriptionsService {
    prisma;
    eventEmitter;
    logger = new common_1.Logger(PrescriptionsService_1.name);
    LOW_STOCK_THRESHOLD = 10;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async createPrescription(dto, doctorId) {
        this.logger.log(`Creating prescription for patient ${dto.patientId} by doctor ${doctorId}`);
        const patient = await this.prisma.patient.findUnique({
            where: { id: dto.patientId },
        });
        if (!patient) {
            throw new common_1.NotFoundException(`Patient with ID ${dto.patientId} not found`);
        }
        const medicineIds = dto.items.map((i) => i.medicineId);
        const medicines = await this.prisma.medicine.findMany({
            where: { id: { in: medicineIds } },
            select: { id: true, name: true, quantity: true },
        });
        for (const item of dto.items) {
            const medicine = medicines.find((m) => m.id === item.medicineId);
            if (!medicine) {
                throw new common_1.NotFoundException(`Medicine with ID ${item.medicineId} not found`);
            }
            if (medicine.quantity < item.quantity) {
                throw new common_1.UnprocessableEntityException(`Insufficient stock for "${medicine.name}": available ${medicine.quantity}, requested ${item.quantity}`);
            }
        }
        const medicineUpdates = dto.items.map((item) => {
            const medicine = medicines.find((m) => m.id === item.medicineId);
            return {
                medicineId: medicine.id,
                name: medicine.name,
                newQuantity: medicine.quantity - item.quantity,
            };
        });
        const prescription = await this.prisma.$transaction(async (tx) => {
            await Promise.all(dto.items.map((item) => tx.medicine.update({
                where: { id: item.medicineId },
                data: { quantity: { decrement: item.quantity } },
            })));
            return tx.prescription.create({
                data: {
                    patient: { connect: { id: dto.patientId } },
                    doctor: { connect: { id: doctorId } },
                    status: client_1.PrescriptionStatus.PENDING,
                    items: {
                        create: dto.items.map((item) => ({
                            medicine: { connect: { id: item.medicineId } },
                            quantity: item.quantity,
                        })),
                    },
                },
                include: {
                    items: {
                        include: {
                            medicine: { select: { name: true } },
                        },
                    },
                },
            });
        }, { timeout: 30000 });
        this.eventEmitter.emit(prescription_events_1.PRESCRIPTION_CREATED, {
            prescriptionId: prescription.id,
            doctorId,
            patientId: dto.patientId,
            medicines: medicineUpdates,
        });
        return this.toResponseDto(prescription);
    }
    async findAll(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [total, prescriptions] = await Promise.all([
            this.prisma.prescription.count(),
            this.prisma.prescription.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { items: true } },
                },
            }),
        ]);
        return {
            data: prescriptions.map((p) => ({
                id: p.id,
                patientId: p.patientId,
                doctorId: p.doctorId,
                status: p.status,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                itemCount: p._count.items,
            })),
            total,
            page,
            limit,
        };
    }
    async findById(id) {
        const prescription = await this.prisma.prescription.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        medicine: { select: { name: true } },
                    },
                },
            },
        });
        if (!prescription) {
            throw new common_1.NotFoundException(`Prescription with ID ${id} not found`);
        }
        return this.toResponseDto(prescription);
    }
    async updateStatus(id, dto) {
        const prescription = await this.prisma.prescription.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!prescription) {
            throw new common_1.NotFoundException(`Prescription with ID ${id} not found`);
        }
        if (dto.status === client_1.PrescriptionStatus.CANCELLED) {
            await this.prisma.$transaction(async (tx) => {
                await Promise.all(prescription.items.map((item) => tx.medicine.update({
                    where: { id: item.medicineId },
                    data: { quantity: { increment: item.quantity } },
                })));
                await tx.prescription.update({
                    where: { id },
                    data: { status: client_1.PrescriptionStatus.CANCELLED },
                });
            }, { timeout: 30000 });
            this.eventEmitter.emit(prescription_events_1.PRESCRIPTION_CANCELLED, { prescriptionId: id });
        }
        else {
            await this.prisma.prescription.update({
                where: { id },
                data: { status: dto.status },
            });
        }
        return this.findById(id);
    }
    toResponseDto(prescription) {
        return {
            id: prescription.id,
            patientId: prescription.patientId,
            doctorId: prescription.doctorId,
            status: prescription.status,
            createdAt: prescription.createdAt,
            updatedAt: prescription.updatedAt,
            items: prescription.items?.map((item) => ({
                id: item.id,
                medicineId: item.medicineId,
                medicineName: item.medicine?.name ?? '',
                quantity: item.quantity,
                createdAt: item.createdAt,
            })),
            itemCount: prescription._count?.items,
        };
    }
};
exports.PrescriptionsService = PrescriptionsService;
exports.PrescriptionsService = PrescriptionsService = PrescriptionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], PrescriptionsService);
//# sourceMappingURL=prescriptions.service.js.map