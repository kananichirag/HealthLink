import { IsEnum } from 'class-validator';
import { PrescriptionStatus } from '@prisma/client';

export class UpdatePrescriptionStatusDto {
  @IsEnum(PrescriptionStatus)
  status: PrescriptionStatus;
}
