import { IsUUID } from 'class-validator';

export class PrescriptionCheckoutDto {
  @IsUUID()
  prescriptionId: string;
}
