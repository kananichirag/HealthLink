import { Gender } from '@prisma/client';
export declare class UpdatePatientDto {
    name?: string;
    age?: number;
    gender?: Gender;
    medicalHistory?: string;
}
