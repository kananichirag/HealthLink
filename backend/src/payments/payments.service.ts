import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentResponseDto, PaginatedPaymentsResponseDto } from './dto/payment-response.dto';
import { PAYMENT_STATUS_UPDATED, PaymentStatusUpdatedPayload } from './events/payment.events';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  async createPaymentIntent(
    dto: CreatePaymentIntentDto,
    userId: string,
  ): Promise<PaymentResponseDto> {
    this.logger.log(`Creating payment intent for user ${userId}, amount: ${dto.amount} ${dto.currency}`);

    const intent = await this.stripeService.createPaymentIntent(
      dto.amount,
      dto.currency,
      { userId, paymentType: dto.paymentType, ...(dto.orderId && { orderId: dto.orderId }) },
    );

    const payment = await this.prisma.payment.create({
      data: {
        stripePaymentIntentId: intent.id,
        amount: dto.amount,
        currency: dto.currency.toUpperCase(),
        status: PaymentStatus.PENDING,
        paymentType: dto.paymentType,
        user: { connect: { id: userId } },
        ...(dto.orderId ? { order: { connect: { id: dto.orderId } } } : {}),
      },
    });

    return {
      ...payment,
      clientSecret: intent.client_secret ?? undefined,
    };
  }

  async findAll(page: number = 1, limit: number = 10): Promise<PaginatedPaymentsResponseDto> {
    const skip = (page - 1) * limit;

    const [total, payments] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { data: payments, total, page, limit };
  }

  async findById(id: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret') ?? '';
    const event = this.stripeService.constructEvent(rawBody, signature, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as { id: string };
        await this.updatePaymentStatus(intent.id, PaymentStatus.SUCCEEDED);
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as { id: string };
        await this.updatePaymentStatus(intent.id, PaymentStatus.FAILED);
        break;
      }
      default:
        this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async updatePaymentStatus(
    stripePaymentIntentId: string,
    status: PaymentStatus,
  ): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for Stripe intent: ${stripePaymentIntentId}`);
      return;
    }

    await this.prisma.payment.update({
      where: { stripePaymentIntentId },
      data: { status },
    });

    const payload: PaymentStatusUpdatedPayload = {
      paymentId: payment.id,
      userId: payment.userId,
      newStatus: status,
      amount: payment.amount,
      currency: payment.currency,
    };
    this.eventEmitter.emit(PAYMENT_STATUS_UPDATED, payload);
  }
}
