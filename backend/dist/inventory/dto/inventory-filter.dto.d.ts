export declare enum StockStatus {
    LOW = "LOW",
    NORMAL = "NORMAL"
}
export declare enum ExpiryStatus {
    EXPIRED = "EXPIRED",
    EXPIRING = "EXPIRING",
    NORMAL = "NORMAL"
}
export declare class InventoryFilterDto {
    page?: number;
    limit?: number;
    search?: string;
    stockStatus?: StockStatus;
    expiryStatus?: ExpiryStatus;
}
export declare class BulkUpdateStockDto {
    updates: Array<{
        id: string;
        quantity: number;
    }>;
}
