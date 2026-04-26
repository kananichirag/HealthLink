import {
  Injectable,
  Logger,
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StripeLib = require('stripe');
// Stripe v22 exports the class as the default export; the namespace types live on the same symbol
type StripeInstance = InstanceType<typeof StripeLib>;
type PaymentIntent = { id: string; client_secret: string | null; [key: string]: unknown };
type StripeEvent = { type: string; data: { object: unknown }; [key: string]: unknown };

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: StripeInstance | null = null;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      this.logger.warn(
        'STRIPE_SECRET_KEY is not configured. Stripe features will be unavailable.',
      );
    } else {
      // Stripe v22 constructor: new Stripe(key, { apiVersion })
      this.stripe = new StripeLib(secretKey, { apiVersion: '2026-03-25.dahlia' });
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>,
  ): Promise<PaymentIntent> {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Payment service unavailable');
    }

    try {
      return await this.stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        metadata: metadata ?? {},
      }) as PaymentIntent;
    } catch (error) {
      this.logger.error(`Stripe createPaymentIntent failed: ${error.message}`, error.stack);
      throw new BadGatewayException('Payment service unavailable');
    }
  }

  constructEvent(
    rawBody: Buffer,
    signature: string,
    secret: string,
  ): StripeEvent {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Payment service unavailable');
    }

    try {
      return this.stripe.webhooks.constructEvent(rawBody, signature, secret) as StripeEvent;
    } catch (error) {
      this.logger.warn(`Stripe webhook signature validation failed: ${error.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}
