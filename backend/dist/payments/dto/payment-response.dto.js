"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedPaymentsResponseDto = exports.PaymentResponseDto = void 0;
class PaymentResponseDto {
    id;
    stripePaymentIntentId;
    amount;
    currency;
    status;
    paymentType;
    orderId;
    userId;
    createdAt;
    updatedAt;
    clientSecret;
}
exports.PaymentResponseDto = PaymentResponseDto;
class PaginatedPaymentsResponseDto {
    data;
    total;
    page;
    limit;
}
exports.PaginatedPaymentsResponseDto = PaginatedPaymentsResponseDto;
//# sourceMappingURL=payment-response.dto.js.map