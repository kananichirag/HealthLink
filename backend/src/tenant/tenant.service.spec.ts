import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantType } from '@prisma/client';

describe('TenantService', () => {
  let service: TenantService;

  const mockTenant = {
    id: 'tenant-1',
    name: 'Test Pharmacy',
    type: TenantType.PHARMACY,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    tenant: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    it('should create a tenant with name and type', async () => {
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);

      const result = await service.createTenant({
        name: 'Test Pharmacy',
        type: TenantType.PHARMACY,
      });

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.create).toHaveBeenCalledWith({
        data: { name: 'Test Pharmacy', type: TenantType.PHARMACY },
      });
    });
  });

  describe('findAll', () => {
    it('should return all tenants ordered by createdAt desc', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([mockTenant]);

      const result = await service.findAll();

      expect(result).toEqual([mockTenant]);
      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return a tenant by id', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findById('tenant-1');

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
      });
    });

    it('should throw NotFoundException when tenant not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('activate', () => {
    it('should set isActive to true', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.tenant.update.mockResolvedValue({ ...mockTenant, isActive: true });

      const result = await service.activate('tenant-1');

      expect(result.isActive).toBe(true);
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { isActive: true },
      });
    });

    it('should throw NotFoundException for nonexistent tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.activate('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.tenant.update.mockResolvedValue({ ...mockTenant, isActive: false });

      const result = await service.deactivate('tenant-1');

      expect(result.isActive).toBe(false);
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { isActive: false },
      });
    });
  });

  describe('getUserCount', () => {
    it('should return the number of users for a tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.user.count.mockResolvedValue(5);

      const result = await service.getUserCount('tenant-1');

      expect(result).toBe(5);
      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
      });
    });

    it('should throw NotFoundException for nonexistent tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.getUserCount('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
