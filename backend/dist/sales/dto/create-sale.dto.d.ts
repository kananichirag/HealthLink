import { SalePaymentMethod, DiscountType } from '@prisma/client';
export declare class SaleItemDto {
    medicineId: string;
    quantity: number;
    pricePerUnit: number;
}
export declare class CreateSaleDto {
    customerName: string;
    prescriptionId?: string;
    paymentMethod: SalePaymentMethod;
    discountType?: DiscountType;
    discount?: number;
    taxRate?: number;
    items: SaleItemDto[];
}
