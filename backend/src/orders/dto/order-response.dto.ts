import { OrderStatus } from '@prisma/client';

export class OrderResponseDto {
  id: string;
  prescriptionId: string;
  pharmacyId: string;
  status: OrderStatus;
  trackingInfo?: string | null;
  createdAt: Date;
  updatedAt: Date;
  prescription?: {
    id: string;
    patientId: string;
    doctorId: string;
    status: string;
  };
  pharmacy?: {
    id: string;
    name: string;
  };
}

export class PaginatedOrdersResponseDto {
  data: OrderResponseDto[];
  total: number;
  page: number;
  limit: number;
}
