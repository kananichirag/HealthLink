import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto, PaginatedOrdersResponseDto } from './dto/order-response.dto';
export declare class OrdersService {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    createOrder(dto: CreateOrderDto, pharmacyId: string): Promise<OrderResponseDto>;
    findAll(page?: number, limit?: number): Promise<PaginatedOrdersResponseDto>;
    findById(id: string): Promise<OrderResponseDto>;
    updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<OrderResponseDto>;
    private toResponseDto;
}
