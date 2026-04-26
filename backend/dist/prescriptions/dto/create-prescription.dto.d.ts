export declare class PrescriptionItemDto {
    medicineId: string;
    quantity: number;
}
export declare class CreatePrescriptionDto {
    patientId: string;
    items: PrescriptionItemDto[];
}
