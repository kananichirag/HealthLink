import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentResponseDto, PaginatedPaymentsResponseDto } from './dto/payment-response.dto';
export declare class PaymentsService {
    private readonly prisma;
    private readonly stripeService;
    private readonly eventEmitter;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, stripeService: StripeService, eventEmitter: EventEmitter2, configService: ConfigService);
    createPaymentIntent(dto: CreatePaymentIntentDto, userId: string): Promise<PaymentResponseDto>;
    findAll(page?: number, limit?: number): Promise<PaginatedPaymentsResponseDto>;
    findById(id: string): Promise<PaymentResponseDto>;
    handleWebhook(rawBody: Buffer, signature: string): Promise<void>;
    private updatePaymentStatus;
}
