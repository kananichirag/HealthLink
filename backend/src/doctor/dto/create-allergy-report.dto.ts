import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AllergySeverity } from '@prisma/client';

export class CreateAllergyReportDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  allergyType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  symptoms: string;

  @IsEnum(AllergySeverity, {
    message: 'severity must be one of: LOW, MODERATE, HIGH, CRITICAL',
  })
  severity: AllergySeverity;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
