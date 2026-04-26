import type { Request } from 'express';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    createSale(createSaleDto: CreateSaleDto, req: Request): Promise<import("./dto").SaleResponseDto>;
    findAll(page?: string, limit?: string, startDate?: string, endDate?: string): Promise<{
        sales: import("./dto").SaleResponseDto[];
        total: number;
    }>;
    getDailyReport(date?: string): Promise<import("./dto").DailySalesReportDto>;
    findOne(id: string): Promise<import("./dto").SaleResponseDto>;
    getInvoice(id: string): Promise<import("./dto").InvoiceResponseDto>;
}
