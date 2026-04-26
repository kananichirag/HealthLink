import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, SaleResponseDto, InvoiceResponseDto, DailySalesReportDto } from './dto';
export declare class SalesService {
    private readonly prisma;
    private readonly configService;
    private readonly eventEmitter;
    private readonly pharmacyName;
    private readonly pharmacyAddress;
    private readonly nearExpiryThreshold;
    constructor(prisma: PrismaService, configService: ConfigService, eventEmitter: EventEmitter2);
    createSale(dto: CreateSaleDto, userId: string | null): Promise<SaleResponseDto>;
    findAll(page?: number, limit?: number, startDate?: string, endDate?: string): Promise<{
        sales: SaleResponseDto[];
        total: number;
    }>;
    findById(id: string): Promise<SaleResponseDto>;
    generateInvoice(id: string): Promise<InvoiceResponseDto>;
    getDailyReport(date?: string): Promise<DailySalesReportDto>;
    private calculateFinancials;
    private emitNearExpiryEvents;
    private formatSaleResponse;
}
