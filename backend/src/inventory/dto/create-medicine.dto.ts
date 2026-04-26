import { IsString, IsInt, IsDateString, IsNotEmpty, Min, MaxLength, Matches } from 'class-validator';

export class CreateMedicineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-_]+$/, { message: 'Batch number must be alphanumeric with hyphens and underscores only' })
  batchNumber: string;

  @IsDateString()
  expiryDate: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  supplier: string;
}