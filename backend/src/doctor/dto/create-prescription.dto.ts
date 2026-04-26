import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PrescriptionItemDto {
  @IsString()
  medicineName: string;

  @IsString()
  dosage: string;

  @IsString()
  frequency: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreatePrescriptionDto {
  @IsUUID()
  patientId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];

  @IsOptional()
  @IsUUID()
  targetPharmacyId?: string;
}
