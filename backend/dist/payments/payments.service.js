"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PaymentsService", {
    enumerable: true,
    get: function() {
        return PaymentsService;
    }
});
const _common = require("@nestjs/common");
const _eventemitter = require("@nestjs/event-emitter");
const _config = require("@nestjs/config");
const _prismaservice = require("../prisma/prisma.service");
const _stripeservice = require("./stripe.service");
const _paymentevents = require("./events/payment.events");
const _client = require("@prisma/client");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PaymentsService = class PaymentsService {
    async createPaymentIntent(dto, userId) {
        this.logger.log(`Creating payment intent for user ${userId}, amount: ${dto.amount} ${dto.currency}`);
        const intent = await this.stripeService.createPaymentIntent(dto.amount, dto.currency, {
            userId,
            paymentType: dto.paymentType,
            ...dto.orderId && {
                orderId: dto.orderId
            }
        });
        const payment = await this.prisma.payment.create({
            data: {
                stripePaymentIntentId: intent.id,
                amount: dto.amount,
                currency: dto.currency.toUpperCase(),
                status: _client.PaymentStatus.PENDING,
                paymentType: dto.paymentType,
                user: {
                    connect: {
                        id: userId
                    }
                },
                ...dto.orderId ? {
                    order: {
                        connect: {
                            id: dto.orderId
                        }
                    }
                } : {}
            }
        });
        return {
            ...payment,
            clientSecret: intent.client_secret ?? undefined
        };
    }
    async findAll(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [total, payments] = await Promise.all([
            this.prisma.payment.count(),
            this.prisma.payment.findMany({
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            })
        ]);
        return {
            data: payments,
            total,
            page,
            limit
        };
    }
    async findById(id) {
        const payment = await this.prisma.payment.findUnique({
            where: {
                id
            }
        });
        if (!payment) {
            throw new _common.NotFoundException(`Payment with ID ${id} not found`);
        }
        return payment;
    }
    async handleWebhook(rawBody, signature) {
        const webhookSecret = this.configService.get('stripe.webhookSecret') ?? '';
        const event = this.stripeService.constructEvent(rawBody, signature, webhookSecret);
        switch(event.type){
            case 'payment_intent.succeeded':
                {
                    const intent = event.data.object;
                    await this.updatePaymentStatus(intent.id, _client.PaymentStatus.SUCCEEDED);
                    break;
                }
            case 'payment_intent.payment_failed':
                {
                    const intent = event.data.object;
                    await this.updatePaymentStatus(intent.id, _client.PaymentStatus.FAILED);
                    break;
                }
            default:
                this.logger.log(`Unhandled Stripe event type: ${event.type}`);
        }
    }
    async updatePaymentStatus(stripePaymentIntentId, status) {
        const payment = await this.prisma.payment.findUnique({
            where: {
                stripePaymentIntentId
            }
        });
        if (!payment) {
            this.logger.warn(`Payment not found for Stripe intent: ${stripePaymentIntentId}`);
            return;
        }
        await this.prisma.payment.update({
            where: {
                stripePaymentIntentId
            },
            data: {
                status
            }
        });
        const payload = {
            paymentId: payment.id,
            userId: payment.userId,
            newStatus: status,
            amount: payment.amount,
            currency: payment.currency
        };
        this.eventEmitter.emit(_paymentevents.PAYMENT_STATUS_UPDATED, payload);
    }
    constructor(prisma, stripeService, eventEmitter, configService){
        this.prisma = prisma;
        this.stripeService = stripeService;
        this.eventEmitter = eventEmitter;
        this.configService = configService;
        this.logger = new _common.Logger(PaymentsService.name);
    }
};
PaymentsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _stripeservice.StripeService === "undefined" ? Object : _stripeservice.StripeService,
        typeof _eventemitter.EventEmitter2 === "undefined" ? Object : _eventemitter.EventEmitter2,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], PaymentsService);

//# sourceMappingURL=payments.service.js.map