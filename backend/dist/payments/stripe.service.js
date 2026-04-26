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
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const StripeLib = require('stripe');
let StripeService = StripeService_1 = class StripeService {
    configService;
    logger = new common_1.Logger(StripeService_1.name);
    stripe = null;
    constructor(configService) {
        this.configService = configService;
        const secretKey = this.configService.get('stripe.secretKey');
        if (!secretKey) {
            this.logger.warn('STRIPE_SECRET_KEY is not configured. Stripe features will be unavailable.');
        }
        else {
            this.stripe = new StripeLib(secretKey, { apiVersion: '2026-03-25.dahlia' });
        }
    }
    async createPaymentIntent(amount, currency, metadata) {
        if (!this.stripe) {
            throw new common_1.ServiceUnavailableException('Payment service unavailable');
        }
        try {
            return await this.stripe.paymentIntents.create({
                amount,
                currency: currency.toLowerCase(),
                metadata: metadata ?? {},
            });
        }
        catch (error) {
            this.logger.error(`Stripe createPaymentIntent failed: ${error.message}`, error.stack);
            throw new common_1.BadGatewayException('Payment service unavailable');
        }
    }
    constructEvent(rawBody, signature, secret) {
        if (!this.stripe) {
            throw new common_1.ServiceUnavailableException('Payment service unavailable');
        }
        try {
            return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
        }
        catch (error) {
            this.logger.warn(`Stripe webhook signature validation failed: ${error.message}`);
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map