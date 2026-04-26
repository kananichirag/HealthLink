export declare class PaymentMethodBreakdownDto {
    count: number;
    revenue: number;
}
export declare class DailySalesReportDto {
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
