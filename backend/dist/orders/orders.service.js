"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OrdersService", {
    enumerable: true,
    get: function() {
        return OrdersService;
    }
});
const _common = require("@nestjs/common");
const _eventemitter = require("@nestjs/event-emitter");
const _prismaservice = require("../prisma/prisma.service");
const _orderevents = require("./events/order.events");
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
let OrdersService = class OrdersService {
    async createOrder(dto, pharmacyId) {
        this.logger.log(`Creating order for prescription ${dto.prescriptionId} by pharmacy ${pharmacyId}`);
        // Validate prescription exists
        const prescription = await this.prisma.prescription.findUnique({
            where: {
                id: dto.prescriptionId
            },
            include: {
                patient: {
                    select: {
                        id: true
                    }
                }
            }
        });
        if (!prescription) {
            throw new _common.NotFoundException(`Prescription with ID ${dto.prescriptionId} not found`);
        }
        if (prescription.status !== _client.PrescriptionStatus.PENDING) {
            throw new _common.UnprocessableEntityException(`Prescription is not eligible for order creation. Current status: ${prescription.status}`);
        }
        // Create order and update prescription status atomically
        const order = await this.prisma.$transaction(async (tx)=>{
            const created = await tx.order.create({
                data: {
                    prescription: {
                        connect: {
                            id: dto.prescriptionId
                        }
                    },
                    pharmacy: {
                        connect: {
                            id: pharmacyId
                        }
                    },
                    status: _client.OrderStatus.PENDING
                },
                include: {
                    prescription: {
                        select: {
                            id: true,
                            patientId: true,
                            doctorId: true,
                            status: true
                        }
                    },
                    pharmacy: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
            await tx.prescription.update({
                where: {
                    id: dto.prescriptionId
                },
                data: {
                    status: _client.PrescriptionStatus.DISPENSED
                }
            });
            return created;
        }, {
            timeout: 30000
        });
        // Emit event
        const payload = {
            orderId: order.id,
            prescriptionId: order.prescriptionId,
            patientId: prescription.patientId,
            pharmacyId,
            newStatus: _client.OrderStatus.PENDING,
            trackingInfo: null
        };
        this.eventEmitter.emit(_orderevents.ORDER_STATUS_UPDATED, payload);
        return this.toResponseDto(order);
    }
    async findAll(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [total, orders] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.order.findMany({
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    prescription: {
                        select: {
                            id: true,
                            patientId: true,
                            doctorId: true,
                            status: true
                        }
                    },
                    pharmacy: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            })
        ]);
        return {
            data: orders.map((o)=>this.toResponseDto(o)),
            total,
            page,
            limit
        };
    }
    async findById(id) {
        const order = await this.prisma.order.findUnique({
            where: {
                id
            },
            include: {
                prescription: {
                    select: {
                        id: true,
                        patientId: true,
                        doctorId: true,
                        status: true
                    }
                },
                pharmacy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        if (!order) {
            throw new _common.NotFoundException(`Order with ID ${id} not found`);
        }
        return this.toResponseDto(order);
    }
    async updateStatus(id, dto) {
        const order = await this.prisma.order.findUnique({
            where: {
                id
            },
            include: {
                prescription: {
                    select: {
                        patientId: true
                    }
                }
            }
        });
        if (!order) {
            throw new _common.NotFoundException(`Order with ID ${id} not found`);
        }
        const updated = await this.prisma.order.update({
            where: {
                id
            },
            data: {
                status: dto.status,
                ...dto.trackingInfo !== undefined && {
                    trackingInfo: dto.trackingInfo
                }
            },
            include: {
                prescription: {
                    select: {
                        id: true,
                        patientId: true,
                        doctorId: true,
                        status: true
                    }
                },
                pharmacy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        // Emit event for SHIPPED or DELIVERED
        if (dto.status === _client.OrderStatus.SHIPPED || dto.status === _client.OrderStatus.DELIVERED) {
            const payload = {
                orderId: updated.id,
                prescriptionId: updated.prescriptionId,
                patientId: order.prescription.patientId,
                pharmacyId: updated.pharmacyId,
                newStatus: dto.status,
                trackingInfo: updated.trackingInfo
            };
            this.eventEmitter.emit(_orderevents.ORDER_STATUS_UPDATED, payload);
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
            pharmacy: order.pharmacy
        };
    }
    constructor(prisma, eventEmitter){
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.logger = new _common.Logger(OrdersService.name);
    }
};
OrdersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _eventemitter.EventEmitter2 === "undefined" ? Object : _eventemitter.EventEmitter2
    ])
], OrdersService);

//# sourceMappingURL=orders.service.js.map