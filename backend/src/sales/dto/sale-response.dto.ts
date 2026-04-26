import { SalePaymentMethod, DiscountType } from '@prisma/client';
import { SaleItemResponseDto } from './sale-item-response.dto';

export class SaleResponseDto {
  id: string;
  customerName: string;
  prescriptionId?: string;
  paymentMethod: SalePaymentMethod;
  discountType: DiscountType;
  subtotal: number;
  discount: number;
  tax: number;
  finalAmount: number;
  createdBy: string;
  createdAt: string;
  items?: SaleItemResponseDto[];
  itemCount?: number;
}