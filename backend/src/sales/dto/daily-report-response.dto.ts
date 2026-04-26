export class PaymentMethodBreakdownDto {
  count: number;
  revenue: number;
}

export class DailySalesReportDto {
  date: string;
  totalSales: number;
  totalRevenue: number;
  totalItemsSold: number;
  paymentMethodBreakdown: {
    CASH: PaymentMethodBreakdownDto;
    CARD: PaymentMethodBreakdownDto;
    ONLINE: PaymentMethodBreakdownDto;
  };
}