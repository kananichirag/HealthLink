import { PaymentType } from '@prisma/client';
export declare class CreatePaymentIntentDto {
    amount: number;
    currency: string;
    paymentType: PaymentType;
    orderId?: string;
}
