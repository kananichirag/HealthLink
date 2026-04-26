import { PaymentStatus, PaymentType } from '@prisma/client';

export class PaymentResponseDto {
  id: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentType: PaymentType;
  orderId?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  clientSecret?: string;
}

export class PaginatedPaymentsResponseDto {
  data: PaymentResponseDto[];
  total: number;
  page: number;
  limit: number;
}
