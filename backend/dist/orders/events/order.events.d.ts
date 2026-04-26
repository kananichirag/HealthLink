export declare const ORDER_STATUS_UPDATED = "order.status.updated";
export interface OrderStatusUpdatedPayload {
    orderId: string;
    prescriptionId: string;
    patientId: string;
    pharmacyId: string;
    newStatus: string;
    trackingInfo?: string | null;
}
