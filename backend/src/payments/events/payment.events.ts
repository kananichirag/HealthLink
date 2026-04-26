export const PAYMENT_STATUS_UPDATED = 'payment.status.updated';

export interface PaymentStatusUpdatedPayload {
  paymentId: string;
  userId: string;
  newStatus: string;
  amount: number;
  currency: string;
}
