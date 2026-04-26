import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecordPurchaseDto {
  @IsString()
  @IsNotEmpty()
  medicineId: string;

  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsString()
  @IsNotEmpty()
  sellerName: string;

  @IsString()
  @IsNotEmpty()
  sellerCompany: string;

  @IsDateString()
  purchaseDate: string;
}
