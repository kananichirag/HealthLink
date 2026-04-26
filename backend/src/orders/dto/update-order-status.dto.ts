import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum([OrderStatus.SHIPPED, OrderStatus.DELIVERED])
  status: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  trackingInfo?: string;
}
