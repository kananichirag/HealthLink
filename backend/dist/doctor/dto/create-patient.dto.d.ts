import { Gender } from '@prisma/client';
export declare class CreatePatientDto {
    name: string;
    email?: string;
    mobile?: string;
    age: number;
    gender: Gender;
    medicalHistory?: string;
}
