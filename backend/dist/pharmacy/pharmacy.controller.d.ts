import { PharmacyService } from './pharmacy.service';
import { PrescriptionQueryDto, MedicineQueryDto, AddMedicineDto, UpdateMedicineDto, RecordPurchaseDto, PurchaseQueryDto, InventoryQueryDto, PrescriptionCheckoutDto, ReportQueryDto } from './dto';
import { CreateSaleDto } from '../sales/dto';
export declare class PharmacyController {
    private readonly pharmacyService;
    constructor(pharmacyService: PharmacyService);
    listPrescriptions(query: PrescriptionQueryDto, req: any): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    dispensePrescription(id: string, req: any): Promise<any>;
    listMedicines(query: MedicineQueryDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    addMedicine(dto: AddMedicineDto, req: any): Promise<any>;
    updateMedicine(id: string, dto: UpdateMedicineDto): Promise<any>;
    listInventory(query: InventoryQueryDto, req: any): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getInventoryAlerts(req: any): Promise<{
        lowStock: any;
        nearExpiry: any;
    }>;
    recordPurchase(dto: RecordPurchaseDto, req: any): Promise<any>;
    listPurchases(query: PurchaseQueryDto, req: any): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getDailyReport(query: ReportQueryDto, req: any): Promise<{
        date: string;
        totalSales: any;
        totalRevenue: any;
        totalItemsSold: any;
    }>;
    getTopMedicines(query: ReportQueryDto, req: any): Promise<{
        medicineId: string;
        medicineName: string;
        totalQuantity: number;
    }[]>;
    getWeeklySummary(query: ReportQueryDto, req: any): Promise<{
        startDate: string;
        endDate: string;
        totalRevenue: any;
        totalPurchaseCost: any;
        netMargin: number;
    }>;
    getPaymentBreakdown(query: ReportQueryDto, req: any): Promise<Record<string, {
        count: number;
        revenue: number;
    }>>;
    prescriptionCheckout(dto: PrescriptionCheckoutDto, req: any): Promise<{
        prescriptionId: any;
        patientName: any;
        doctorName: any;
        items: any[];
        allAvailable: boolean;
    }>;
    createSale(dto: CreateSaleDto, req: any): Promise<import("../sales/dto").SaleResponseDto>;
    listSales(page?: string, limit?: string, startDate?: string, endDate?: string): Promise<{
        sales: import("../sales/dto").SaleResponseDto[];
        total: number;
    }>;
    getSaleDetail(id: string): Promise<import("../sales/dto").SaleResponseDto>;
    getInvoice(id: string): Promise<import("../sales/dto").InvoiceResponseDto>;
    sendBillToPatient(id: string): Promise<{
        message: string;
        saleId: string;
    }>;
}
