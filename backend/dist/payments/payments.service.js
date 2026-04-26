"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const stripe_service_1 = require("./stripe.service");
const payment_events_1 = require("./events/payment.events");
const client_1 = require("@prisma/client");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    stripeService;
    eventEmitter;
    configService;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(prisma, stripeService, eventEmitter, configService) {
        this.prisma = prisma;
        this.stripeService = stripeService;
        this.eventEmitter = eventEmitter;
        this.configService = configService;
    }
    async createPaymentIntent(dto, userId) {
        this.logger.log(`Creating payment intent for user ${userId}, amount: ${dto.amount} ${dto.currency}`);
        const intent = await this.stripeService.createPaymentIntent(dto.amount, dto.currency, { userId, paymentType: dto.paymentType, ...(dto.orderId && { orderId: dto.orderId }) });
        const payment = await this.prisma.payment.create({
            data: {
                stripePaymentIntentId: intent.id,
                amount: dto.amount,
                currency: dto.currency.toUpperCase(),
                status: client_1.PaymentStatus.PENDING,
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
    async findAll(page = 1, limit = 10) {
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
    async findById(id) {
        const payment = await this.prisma.payment.findUnique({ where: { id } });
        if (!payment) {
            throw new common_1.NotFoundException(`Payment with ID ${id} not found`);
        }
        return payment;
    }
    async handleWebhook(rawBody, signature) {
        const webhookSecret = this.configService.get('stripe.webhookSecret') ?? '';
        const event = this.stripeService.constructEvent(rawBody, signature, webhookSecret);
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const intent = event.data.object;
                await this.updatePaymentStatus(intent.id, client_1.PaymentStatus.SUCCEEDED);
                break;
            }
            case 'payment_intent.payment_failed': {
                const intent = event.data.object;
                await this.updatePaymentStatus(intent.id, client_1.PaymentStatus.FAILED);
                break;
            }
            default:
                this.logger.log(`Unhandled Stripe event type: ${event.type}`);
        }
    }
    async updatePaymentStatus(stripePaymentIntentId, status) {
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
        const payload = {
            paymentId: payment.id,
            userId: payment.userId,
            newStatus: status,
            amount: payment.amount,
            currency: payment.currency,
        };
        this.eventEmitter.emit(payment_events_1.PAYMENT_STATUS_UPDATED, payload);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stripe_service_1.StripeService,
        event_emitter_1.EventEmitter2,
        config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map