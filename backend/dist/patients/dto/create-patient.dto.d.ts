import { Gender } from '@prisma/client';
export declare class CreatePatientDto {
    name: string;
    age: number;
    gender: Gender;
    medicalHistory?: string;
}
