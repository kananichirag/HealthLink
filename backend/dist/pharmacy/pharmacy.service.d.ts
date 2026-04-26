import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SalesService } from '../sales/sales.service';
import { PrescriptionQueryDto, MedicineQueryDto, AddMedicineDto, UpdateMedicineDto, RecordPurchaseDto, PurchaseQueryDto, InventoryQueryDto, ReportQueryDto } from './dto';
import { CreateSaleDto } from '../sales/dto';
export declare class PharmacyService {
    private readonly prisma;
    private readonly notificationsService;
    private readonly salesService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, salesService: SalesService);
    listPrescriptions(query: PrescriptionQueryDto, pharmacyUserId: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    dispensePrescription(prescriptionId: string, pharmacyUserId: string): Promise<any>;
    listMedicines(query: MedicineQueryDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    addMedicine(dto: AddMedicineDto, tenantId: string): Promise<any>;
    updateMedicine(id: string, dto: UpdateMedicineDto): Promise<any>;
    listInventory(query: InventoryQueryDto, tenantId: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getInventoryAlerts(tenantId: string): Promise<{
        lowStock: any;
        nearExpiry: any;
    }>;
    recordPurchase(dto: RecordPurchaseDto, tenantId: string): Promise<any>;
    listPurchases(query: PurchaseQueryDto, tenantId: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    prescriptionCheckout(prescriptionId: string, pharmacyUserId: string): Promise<{
        prescriptionId: any;
        patientName: any;
        doctorName: any;
        items: any[];
        allAvailable: boolean;
    }>;
    createSale(dto: CreateSaleDto, userId: string | null): Promise<import("../sales/dto").SaleResponseDto>;
    getSaleDetail(id: string): Promise<import("../sales/dto").SaleResponseDto>;
    listSales(page?: number, limit?: number, startDate?: string, endDate?: string): Promise<{
        sales: import("../sales/dto").SaleResponseDto[];
        total: number;
    }>;
    getInvoice(id: string): Promise<import("../sales/dto").InvoiceResponseDto>;
    sendBillToPatient(saleId: string): Promise<{
        message: string;
        saleId: string;
    }>;
    getDailyReport(tenantId: string, query: ReportQueryDto): Promise<{
        date: string;
        totalSales: any;
        totalRevenue: any;
        totalItemsSold: any;
    }>;
    getTopMedicines(tenantId: string, query: ReportQueryDto): Promise<{
        medicineId: string;
        medicineName: string;
        totalQuantity: number;
    }[]>;
    getWeeklySummary(tenantId: string, query: ReportQueryDto): Promise<{
        startDate: string;
        endDate: string;
        totalRevenue: any;
        totalPurchaseCost: any;
        netMargin: number;
    }>;
    getPaymentBreakdown(tenantId: string, query: ReportQueryDto): Promise<Record<string, {
        count: number;
        revenue: number;
    }>>;
}
