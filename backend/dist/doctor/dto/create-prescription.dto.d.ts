export declare class PrescriptionItemDto {
    medicineName: string;
    dosage: string;
    frequency: string;
    quantity: number;
}
export declare class CreatePrescriptionDto {
    patientId: string;
    items: PrescriptionItemDto[];
    targetPharmacyId?: string;
}
