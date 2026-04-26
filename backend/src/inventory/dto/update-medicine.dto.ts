import { IsString, IsInt, IsDateString, IsOptional, Min, MaxLength, Matches } from 'class-validator';

export class UpdateMedicineDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-_]+$/, { message: 'Batch number must be alphanumeric with hyphens and underscores only' })
  batchNumber?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  supplier?: string;
}