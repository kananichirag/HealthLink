import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto, PaginatedOrdersResponseDto } from './dto/order-response.dto';
import { ORDER_STATUS_UPDATED, OrderStatusUpdatedPayload } from './events/order.events';
import { OrderStatus, PrescriptionStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createOrder(dto: CreateOrderDto, pharmacyId: string): Promise<OrderResponseDto> {
    this.logger.log(`Creating order for prescription ${dto.prescriptionId} by pharmacy ${pharmacyId}`);

    // Validate prescription exists
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: dto.prescriptionId },
      include: { patient: { select: { id: true } } },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${dto.prescriptionId} not found`);
    }

    if (prescription.status !== PrescriptionStatus.PENDING) {
      throw new UnprocessableEntityException(
        `Prescription is not eligible for order creation. Current status: ${prescription.status}`,
      );
    }

    // Create order and update prescription status atomically
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          prescription: { connect: { id: dto.prescriptionId } },
          pharmacy: { connect: { id: pharmacyId } },
          status: OrderStatus.PENDING,
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
        data: { status: PrescriptionStatus.DISPENSED },
      });

      return created;
    }, { timeout: 30000 });

    // Emit event
    const payload: OrderStatusUpdatedPayload = {
      orderId: order.id,
      prescriptionId: order.prescriptionId,
      patientId: prescription.patientId,
      pharmacyId,
      newStatus: OrderStatus.PENDING,
      trackingInfo: null,
    };
    this.eventEmitter.emit(ORDER_STATUS_UPDATED, payload);

    return this.toResponseDto(order);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<PaginatedOrdersResponseDto> {
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

  async findById(id: string): Promise<OrderResponseDto> {
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
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.toResponseDto(order);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        prescription: { select: { patientId: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
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

    // Emit event for SHIPPED or DELIVERED
    if (dto.status === OrderStatus.SHIPPED || dto.status === OrderStatus.DELIVERED) {
      const payload: OrderStatusUpdatedPayload = {
        orderId: updated.id,
        prescriptionId: updated.prescriptionId,
        patientId: order.prescription.patientId,
        pharmacyId: updated.pharmacyId,
        newStatus: dto.status,
        trackingInfo: updated.trackingInfo,
      };
      this.eventEmitter.emit(ORDER_STATUS_UPDATED, payload);
    }

    return this.toResponseDto(updated);
  }

  private toResponseDto(order: any): OrderResponseDto {
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
}
