import { ConfigService } from '@nestjs/config';
type PaymentIntent = {
    id: string;
    client_secret: string | null;
    [key: string]: unknown;
};
type StripeEvent = {
    type: string;
    data: {
        object: unknown;
    };
    [key: string]: unknown;
};
export declare class StripeService {
    private readonly configService;
    private readonly logger;
    private stripe;
    constructor(configService: ConfigService);
    createPaymentIntent(amount: number, currency: string, metadata?: Record<string, string>): Promise<PaymentIntent>;
    constructEvent(rawBody: Buffer, signature: string, secret: string): StripeEvent;
}
export {};
