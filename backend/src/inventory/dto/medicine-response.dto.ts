export class MedicineResponseDto {
  id: string;
  name: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  supplier: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Status indicators
  stockStatus: 'LOW' | 'NORMAL';
  expiryStatus: 'EXPIRED' | 'EXPIRING' | 'NORMAL';
  daysUntilExpiry: number;
  isActive: boolean;
}

export class InventoryStatsDto {
  lowStock: number;
  expiring: number;
  expired: number;
  total: number;
}

export class PaginatedMedicinesResponseDto {
  data: MedicineResponseDto[];
  total: number;
  page: number;
  limit: number;
  stats: InventoryStatsDto;
}