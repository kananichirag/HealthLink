import { Gender } from '@prisma/client';

export class PatientResponseDto {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  medicalHistory?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Optional metadata fields
  creator?: {
    id: string;
    name: string;
    role: string;
  };
  ageGroup?: 'CHILD' | 'ADULT' | 'SENIOR';
  recordAge?: number; // days since creation
}

export class PaginatedPatientsResponseDto {
  data: PatientResponseDto[];
  total: number;
  page: number;
  limit: number;
}