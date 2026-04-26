import { AllergySeverity } from '@prisma/client';
export declare class CreateAllergyReportDto {
    patientId: string;
    allergyType: string;
    symptoms: string;
    severity: AllergySeverity;
    notes?: string;
}
