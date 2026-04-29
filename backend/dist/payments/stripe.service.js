"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "StripeService", {
    enumerable: true,
    get: function() {
        return StripeService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StripeLib = require('stripe');
let StripeService = class StripeService {
    async createPaymentIntent(amount, currency, metadata) {
        if (!this.stripe) {
            throw new _common.ServiceUnavailableException('Payment service unavailable');
        }
        try {
            return await this.stripe.paymentIntents.create({
                amount,
                currency: currency.toLowerCase(),
                metadata: metadata ?? {}
            });
        } catch (error) {
            this.logger.error(`Stripe createPaymentIntent failed: ${error.message}`, error.stack);
            throw new _common.BadGatewayException('Payment service unavailable');
        }
    }
    constructEvent(rawBody, signature, secret) {
        if (!this.stripe) {
            throw new _common.ServiceUnavailableException('Payment service unavailable');
        }
        try {
            return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
        } catch (error) {
            this.logger.warn(`Stripe webhook signature validation failed: ${error.message}`);
            throw new _common.BadRequestException('Invalid webhook signature');
        }
    }
    constructor(configService){
        this.configService = configService;
        this.logger = new _common.Logger(StripeService.name);
        this.stripe = null;
        const secretKey = this.configService.get('stripe.secretKey');
        if (!secretKey) {
            this.logger.warn('STRIPE_SECRET_KEY is not configured. Stripe features will be unavailable.');
        } else {
            // Stripe v22 constructor: new Stripe(key, { apiVersion })
            this.stripe = new StripeLib(secretKey, {
                apiVersion: '2026-03-25.dahlia'
            });
        }
    }
};
StripeService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], StripeService);

//# sourceMappingURL=stripe.service.js.map