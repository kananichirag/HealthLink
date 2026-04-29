"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PrescriptionsService", {
    enumerable: true,
    get: function() {
        return PrescriptionsService;
    }
});
const _common = require("@nestjs/common");
const _eventemitter = require("@nestjs/event-emitter");
const _prismaservice = require("../prisma/prisma.service");
const _prescriptionevents = require("./events/prescription.events");
const _client = require("@prisma/client");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PrescriptionsService = class PrescriptionsService {
    async createPrescription(dto, doctorId) {
        this.logger.log(`Creating prescription for patient ${dto.patientId} by doctor ${doctorId}`);
        // Validate patient exists (outside transaction — no need to hold a tx open for this)
        const patient = await this.prisma.patient.findUnique({
            where: {
                id: dto.patientId
            }
        });
        if (!patient) {
            throw new _common.NotFoundException(`Patient with ID ${dto.patientId} not found`);
        }
        // Fetch all medicines in a single query (outside transaction to avoid timeout)
        const medicineIds = dto.items.map((i)=>i.medicineId);
        const medicines = await this.prisma.medicine.findMany({
            where: {
                id: {
                    in: medicineIds
                }
            },
            select: {
                id: true,
                name: true,
                quantity: true
            }
        });
        // Validate all medicines exist
        for (const item of dto.items){
            const medicine = medicines.find((m)=>m.id === item.medicineId);
            if (!medicine) {
                throw new _common.NotFoundException(`Medicine with ID ${item.medicineId} not found`);
            }
            if (medicine.quantity < item.quantity) {
                throw new _common.UnprocessableEntityException(`Insufficient stock for "${medicine.name}": available ${medicine.quantity}, requested ${item.quantity}`);
            }
        }
        // Build the medicine update payload for the event (pre-calculate new quantities)
        const medicineUpdates = dto.items.map((item)=>{
            const medicine = medicines.find((m)=>m.id === item.medicineId);
            return {
                medicineId: medicine.id,
                name: medicine.name,
                newQuantity: medicine.quantity - item.quantity
            };
        });
        // Atomic writes only — keep the transaction as short as possible
        const prescription = await this.prisma.$transaction(async (tx)=>{
            // Decrement stock for each medicine
            await Promise.all(dto.items.map((item)=>tx.medicine.update({
                    where: {
                        id: item.medicineId
                    },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        }
                    }
                })));
            // Create prescription with items
            return tx.prescription.create({
                data: {
                    patient: {
                        connect: {
                            id: dto.patientId
                        }
                    },
                    doctor: {
                        connect: {
                            id: doctorId
                        }
                    },
                    status: _client.PrescriptionStatus.PENDING,
                    items: {
                        create: dto.items.map((item)=>({
                                medicine: {
                                    connect: {
                                        id: item.medicineId
                                    }
                                },
                                quantity: item.quantity
                            }))
                    }
                },
                include: {
                    items: {
                        include: {
                            medicine: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
        }, {
            timeout: 30000
        });
        // Emit event after successful commit
        this.eventEmitter.emit(_prescriptionevents.PRESCRIPTION_CREATED, {
            prescriptionId: prescription.id,
            doctorId,
            patientId: dto.patientId,
            medicines: medicineUpdates
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
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    _count: {
                        select: {
                            items: true
                        }
                    }
                }
            })
        ]);
        return {
            data: prescriptions.map((p)=>({
                    id: p.id,
                    patientId: p.patientId,
                    doctorId: p.doctorId,
                    status: p.status,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                    itemCount: p._count.items
                })),
            total,
            page,
            limit
        };
    }
    async findById(id) {
        const prescription = await this.prisma.prescription.findUnique({
            where: {
                id
            },
            include: {
                items: {
                    include: {
                        medicine: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
        if (!prescription) {
            throw new _common.NotFoundException(`Prescription with ID ${id} not found`);
        }
        return this.toResponseDto(prescription);
    }
    async updateStatus(id, dto) {
        const prescription = await this.prisma.prescription.findUnique({
            where: {
                id
            },
            include: {
                items: true
            }
        });
        if (!prescription) {
            throw new _common.NotFoundException(`Prescription with ID ${id} not found`);
        }
        if (dto.status === _client.PrescriptionStatus.CANCELLED) {
            // Restore stock atomically — parallel updates + timeout for remote DB
            await this.prisma.$transaction(async (tx)=>{
                await Promise.all(prescription.items.map((item)=>tx.medicine.update({
                        where: {
                            id: item.medicineId
                        },
                        data: {
                            quantity: {
                                increment: item.quantity
                            }
                        }
                    })));
                await tx.prescription.update({
                    where: {
                        id
                    },
                    data: {
                        status: _client.PrescriptionStatus.CANCELLED
                    }
                });
            }, {
                timeout: 30000
            });
            this.eventEmitter.emit(_prescriptionevents.PRESCRIPTION_CANCELLED, {
                prescriptionId: id
            });
        } else {
            await this.prisma.prescription.update({
                where: {
                    id
                },
                data: {
                    status: dto.status
                }
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
            items: prescription.items?.map((item)=>({
                    id: item.id,
                    medicineId: item.medicineId,
                    medicineName: item.medicine?.name ?? '',
                    quantity: item.quantity,
                    createdAt: item.createdAt
                })),
            itemCount: prescription._count?.items
        };
    }
    constructor(prisma, eventEmitter){
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.logger = new _common.Logger(PrescriptionsService.name);
        this.LOW_STOCK_THRESHOLD = 10;
    }
};
PrescriptionsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _eventemitter.EventEmitter2 === "undefined" ? Object : _eventemitter.EventEmitter2
    ])
], PrescriptionsService);

//# sourceMappingURL=prescriptions.service.js.map