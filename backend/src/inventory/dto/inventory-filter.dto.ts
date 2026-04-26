import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export enum StockStatus {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
}

export enum ExpiryStatus {
  EXPIRED = 'EXPIRED',
  EXPIRING = 'EXPIRING',
  NORMAL = 'NORMAL',
}

export class InventoryFilterDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Math.min(parseInt(value), 100))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(StockStatus)
  stockStatus?: StockStatus;

  @IsOptional()
  @IsEnum(ExpiryStatus)
  expiryStatus?: ExpiryStatus;
}

export class BulkUpdateStockDto {
  updates: Array<{
    id: string;
    quantity: number;
  }>;
}