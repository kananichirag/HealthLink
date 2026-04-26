import { Gender } from '@prisma/client';
export declare class PatientResponseDto {
    id: string;
    name: string;
    age: number;
    gender: Gender;
    medicalHistory?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    creator?: {
        id: string;
        name: string;
        role: string;
    };
    ageGroup?: 'CHILD' | 'ADULT' | 'SENIOR';
    recordAge?: number;
}
export declare class PaginatedPatientsResponseDto {
    data: PatientResponseDto[];
    total: number;
    page: number;
    limit: number;
}
