import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { Request } from 'express';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createIntent(dto: CreatePaymentIntentDto, req: any): Promise<import("./dto").PaymentResponseDto>;
    findAll(page: number, limit: number): Promise<import("./dto").PaginatedPaymentsResponseDto>;
    findOne(id: string): Promise<import("./dto").PaymentResponseDto>;
    handleWebhook(req: Request & {
        rawBody?: Buffer;
    }, signature: string): Promise<{
        received: boolean;
    }>;
}
