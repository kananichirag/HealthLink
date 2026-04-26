import { OrderStatus } from '@prisma/client';
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
    trackingInfo?: string;
}
