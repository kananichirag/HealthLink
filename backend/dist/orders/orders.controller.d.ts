import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(dto: CreateOrderDto, req: any): Promise<import("./dto").OrderResponseDto>;
    findAll(page: number, limit: number): Promise<import("./dto").PaginatedOrdersResponseDto>;
    findOne(id: string): Promise<import("./dto").OrderResponseDto>;
    updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<import("./dto").OrderResponseDto>;
}
