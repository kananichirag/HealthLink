import { PrescriptionStatus } from '@prisma/client';

export class PrescriptionItemResponseDto {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  createdAt: Date;
}

export class PrescriptionResponseDto {
  id: string;
  patientId: string;
  doctorId: string;
  status: PrescriptionStatus;
  createdAt: Date;
  updatedAt: Date;
  items?: PrescriptionItemResponseDto[];
  itemCount?: number;
}

export class PaginatedPrescriptionsResponseDto {
  data: PrescriptionResponseDto[];
  total: number;
  page: number;
  limit: number;
}
