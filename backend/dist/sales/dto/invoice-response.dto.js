"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceResponseDto = exports.InvoiceItemDto = void 0;
class InvoiceItemDto {
    medicineName;
    batchNumber;
    quantity;
    pricePerUnit;
    totalPrice;
}
exports.InvoiceItemDto = InvoiceItemDto;
class InvoiceResponseDto {
    pharmacyName;
    pharmacyAddress;
    invoiceNumber;
    invoiceDate;
    customerName;
    paymentMethod;
    items;
    subtotal;
    discountAmount;
    taxAmount;
    finalAmount;
}
exports.InvoiceResponseDto = InvoiceResponseDto;
//# sourceMappingURL=invoice-response.dto.js.map