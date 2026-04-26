export const PRESCRIPTION_CREATED = 'prescription.created';
export const PRESCRIPTION_CANCELLED = 'prescription.cancelled';

export interface PrescriptionCreatedPayload {
  prescriptionId: string;
  doctorId: string;
  patientId: string;
  medicines: Array<{
    medicineId: string;
    name: string;
    newQuantity: number;
  }>;
}

export interface PrescriptionCancelledPayload {
  prescriptionId: string;
}
