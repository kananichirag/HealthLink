import { Type } from 'class-transformer';
import {
  IsString,
  MaxLength,
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsOptional,
  IsInt,
} from 'class-validator';
import { SalePaymentMethod, DiscountType } from '@prisma/client';

export class SaleItemDto {
  @IsUUID()
  medicineId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  pricePerUnit: number;
}

export class CreateSaleDto {
  @IsString()
  @MaxLength(255)
  customerName: string;

  @IsOptional()
  @IsUUID()
  prescriptionId?: string;

  @IsEnum(SalePaymentMethod)
  paymentMethod: SalePaymentMethod;

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}