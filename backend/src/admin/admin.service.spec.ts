import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: any;

  const mockTenant = {
    id: 'tenant-1',
    name: 'Test Pharmacy',
    type: 'PHARMACY',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'DOCTOR',
    tenantId: 'tenant-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    tenant: { id: 'tenant-1', name: 'Test Pharmacy', type: 'PHARMACY' },
  };

  beforeEach(async () => {
    prisma = {
      tenant: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  describe('listTenants', () => {
    it('should return paginated tenants with user count', async () => {
      const tenantsWithCount = [
        { ...mockTenant, _count: { users: 5 } },
      ];
      prisma.tenant.findMany.mockResolvedValue(tenantsWithCount);
      prisma.tenant.count.mockResolvedValue(1);

      const result = await service.listTenants({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].activeUserCount).toBe(5);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter tenants by search and type', async () => {
      prisma.tenant.findMany.mockResolvedValue([]);
      prisma.tenant.count.mockResolvedValue(0);

      await service.listTenants({ search: 'Test', type: 'PHARMACY' as any });

      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            name: { contains: 'Test', mode: 'insensitive' },
            type: 'PHARMACY',
          },
        }),
      );
    });
  });

  describe('activateTenant', () => {
    it('should activate a tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);
      prisma.tenant.update.mockResolvedValue({ ...mockTenant, isActive: true });

      const result = await service.activateTenant('tenant-1');

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { isActive: true },
      });
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException for non-existent tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.activateTenant('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivateTenant', () => {
    it('should deactivate a tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);
      prisma.tenant.update.mockResolvedValue({ ...mockTenant, isActive: false });

      const result = await service.deactivateTenant('tenant-1');

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException for non-existent tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.deactivateTenant('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listUsers', () => {
    it('should return paginated users', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.listUsers({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('john@example.com');
      expect(result.total).toBe(1);
    });

    it('should filter users by role and tenantId', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.listUsers({ role: 'DOCTOR' as any, tenantId: 'tenant-1' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'DOCTOR', tenantId: 'tenant-1' },
        }),
      );
    });

    it('should filter users by date range', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.listUsers({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
          },
        }),
      );
    });
  });

  describe('activateUser', () => {
    it('should return user info for activation', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, password: 'hashed' });

      const result = await service.activateUser('user-1');

      expect(result.id).toBe('user-1');
      expect(result.password).toBeUndefined();
      expect(result.message).toContain('active');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.activateUser('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivateUser', () => {
    it('should return user info for deactivation', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, password: 'hashed' });

      const result = await service.deactivateUser('user-1');

      expect(result.id).toBe('user-1');
      expect(result.password).toBeUndefined();
      expect(result.message).toContain('deactivation');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deactivateUser('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
