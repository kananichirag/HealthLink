export declare class InvoiceItemDto {
    medicineName: string;
    batchNumber: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
}
export declare class InvoiceResponseDto {
    pharmacyName: string;
    pharmacyAddress: string;
    invoiceNumber: string;
    invoiceDate: string;
    customerName: string;
    paymentMethod: string;
    items: InvoiceItemDto[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    finalAmount: number;
}
