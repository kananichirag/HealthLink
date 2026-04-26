import { Test, TestingModule } from '@nestjs/testing';
import { PharmacyService } from './pharmacy.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SalesService } from '../sales/sales.service';
import { NotFoundException } from '@nestjs/common';

describe('PharmacyService', () => {
  let service: PharmacyService;

  const mockPrismaService = {
    medicine: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    purchaseRecord: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    prescription: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    sale: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    saleItem: {
      findMany: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  const mockSalesService = {
    createSale: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    generateInvoice: jest.fn(),
    getDailyReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PharmacyService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: SalesService, useValue: mockSalesService },
      ],
    }).compile();

    service = module.get<PharmacyService>(PharmacyService);
    jest.clearAllMocks();
  });

  describe('listInventory', () => {
    const tenantId = 'tenant-1';

    it('should return medicines with computed stockStatus and nearExpiry', async () => {
      const now = new Date();
      const nearDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const farDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 'm1', name: 'Med A', quantity: 5, expiryDate: nearDate, tenantId },
        { id: 'm2', name: 'Med B', quantity: 50, expiryDate: farDate, tenantId },
      ];

      mockPrismaService.medicine.count.mockResolvedValue(2);
      mockPrismaService.medicine.findMany.mockResolvedValue(medicines);

      const result = await service.listInventory({}, tenantId);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].stockStatus).toBe('LOW');
      expect(result.data[0].nearExpiry).toBe(true);
      expect(result.data[1].stockStatus).toBe('NORMAL');
      expect(result.data[1].nearExpiry).toBe(false);
      expect(result.total).toBe(2);
    });

    it('should filter by LOW stockStatus', async () => {
      mockPrismaService.medicine.count.mockResolvedValue(0);
      mockPrismaService.medicine.findMany.mockResolvedValue([]);

      await service.listInventory({ stockStatus: 'LOW' }, tenantId);

      expect(mockPrismaService.medicine.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            quantity: { lt: 10 },
          }),
        }),
      );
    });

    it('should filter by NORMAL stockStatus', async () => {
      mockPrismaService.medicine.count.mockResolvedValue(0);
      mockPrismaService.medicine.findMany.mockResolvedValue([]);

      await service.listInventory({ stockStatus: 'NORMAL' }, tenantId);

      expect(mockPrismaService.medicine.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            quantity: { gte: 10 },
          }),
        }),
      );
    });

    it('should support search filter', async () => {
      mockPrismaService.medicine.count.mockResolvedValue(0);
      mockPrismaService.medicine.findMany.mockResolvedValue([]);

      await service.listInventory({ search: 'para' }, tenantId);

      expect(mockPrismaService.medicine.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            OR: [
              { name: { contains: 'para', mode: 'insensitive' } },
              { batchNumber: { contains: 'para', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should handle pagination', async () => {
      mockPrismaService.medicine.count.mockResolvedValue(25);
      mockPrismaService.medicine.findMany.mockResolvedValue([]);

      const result = await service.listInventory({ page: 2, limit: 5 }, tenantId);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(mockPrismaService.medicine.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  describe('getInventoryAlerts', () => {
    const tenantId = 'tenant-1';

    it('should return low stock and near expiry medicines', async () => {
      const lowStockMeds = [
        { id: 'm1', name: 'Med A', quantity: 3, tenantId },
      ];
      const nearExpiryMeds = [
        { id: 'm2', name: 'Med B', expiryDate: new Date(), tenantId },
      ];

      mockPrismaService.medicine.findMany
        .mockResolvedValueOnce(lowStockMeds)
        .mockResolvedValueOnce(nearExpiryMeds);

      const result = await service.getInventoryAlerts(tenantId);

      expect(result.lowStock).toHaveLength(1);
      expect(result.lowStock[0].stockStatus).toBe('LOW');
      expect(result.nearExpiry).toHaveLength(1);
      expect(result.nearExpiry[0].nearExpiry).toBe(true);
    });
  });

  describe('recordPurchase', () => {
    const tenantId = 'tenant-1';
    const dto = {
      medicineId: 'med-1',
      batchNumber: 'BATCH-001',
      quantity: 100,
      unitCost: 5.5,
      sellerName: 'John',
      sellerCompany: 'PharmaCo',
      purchaseDate: '2024-06-01',
    };

    it('should create purchase record and update medicine quantity', async () => {
      mockPrismaService.medicine.findFirst.mockResolvedValue({
        id: 'med-1',
        quantity: 50,
        tenantId,
      });

      const createdPurchase = {
        id: 'purchase-1',
        ...dto,
        totalCost: 550,
        tenantId,
        purchaseDate: new Date('2024-06-01'),
        createdAt: new Date(),
      };

      mockPrismaService.$transaction.mockResolvedValue([createdPurchase, {}]);

      const result = await service.recordPurchase(dto, tenantId);

      expect(result.id).toBe('purchase-1');
      expect(result.totalCost).toBe(550);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      // Verify medicine.update was called with increment
      expect(mockPrismaService.medicine.update).toHaveBeenCalledWith({
        where: { id: 'med-1' },
        data: { quantity: { increment: 100 } },
      });
    });

    it('should throw NotFoundException if medicine not found', async () => {
      mockPrismaService.medicine.findFirst.mockResolvedValue(null);

      await expect(service.recordPurchase(dto, tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate totalCost as quantity * unitCost', async () => {
      mockPrismaService.medicine.findFirst.mockResolvedValue({
        id: 'med-1',
        quantity: 10,
        tenantId,
      });

      // Capture the arguments passed to $transaction
      mockPrismaService.$transaction.mockImplementation(async (args) => {
        return [{ id: 'p1', totalCost: 550 }, {}];
      });

      await service.recordPurchase(dto, tenantId);

      // Verify the purchase record create was called with correct totalCost
      expect(mockPrismaService.purchaseRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          totalCost: 550, // 100 * 5.5
          quantity: 100,
          unitCost: 5.5,
        }),
      });
    });
  });

  describe('listPurchases', () => {
    const tenantId = 'tenant-1';

    it('should return purchases sorted by purchaseDate desc', async () => {
      const purchases = [
        { id: 'p1', purchaseDate: new Date('2024-06-01'), medicine: { id: 'm1', name: 'Med A' } },
        { id: 'p2', purchaseDate: new Date('2024-05-01'), medicine: { id: 'm2', name: 'Med B' } },
      ];

      mockPrismaService.purchaseRecord.count.mockResolvedValue(2);
      mockPrismaService.purchaseRecord.findMany.mockResolvedValue(purchases);

      const result = await service.listPurchases({}, tenantId);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrismaService.purchaseRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { purchaseDate: 'desc' },
          where: { tenantId },
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.purchaseRecord.count.mockResolvedValue(0);
      mockPrismaService.purchaseRecord.findMany.mockResolvedValue([]);

      await service.listPurchases(
        { startDate: '2024-01-01', endDate: '2024-06-30' },
        tenantId,
      );

      expect(mockPrismaService.purchaseRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId,
            purchaseDate: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-06-30'),
            },
          },
        }),
      );
    });

    it('should handle pagination', async () => {
      mockPrismaService.purchaseRecord.count.mockResolvedValue(30);
      mockPrismaService.purchaseRecord.findMany.mockResolvedValue([]);

      const result = await service.listPurchases({ page: 3, limit: 5 }, tenantId);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
      expect(mockPrismaService.purchaseRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it('should include medicine name in results', async () => {
      mockPrismaService.purchaseRecord.count.mockResolvedValue(0);
      mockPrismaService.purchaseRecord.findMany.mockResolvedValue([]);

      await service.listPurchases({}, tenantId);

      expect(mockPrismaService.purchaseRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { medicine: { select: { id: true, name: true } } },
        }),
      );
    });
  });

  describe('getDailyReport', () => {
    const tenantId = 'tenant-1';

    it('should return daily sales count, revenue, and items sold', async () => {
      const sales = [
        {
          id: 's1',
          finalAmount: 150.5,
          paymentMethod: 'CASH',
          items: [
            { quantity: 2 },
            { quantity: 3 },
          ],
        },
        {
          id: 's2',
          finalAmount: 200.0,
          paymentMethod: 'CARD',
          items: [{ quantity: 5 }],
        },
      ];

      mockPrismaService.sale.findMany.mockResolvedValue(sales);

      const result = await service.getDailyReport(tenantId, {});

      expect(result.totalSales).toBe(2);
      expect(result.totalRevenue).toBe(350.5);
      expect(result.totalItemsSold).toBe(10);
    });

    it('should use provided startDate as the target date', async () => {
      mockPrismaService.sale.findMany.mockResolvedValue([]);

      const result = await service.getDailyReport(tenantId, {
        startDate: '2024-06-15',
      });

      expect(result.date).toBe('2024-06-15');
    });

    it('should return zeros when no sales exist', async () => {
      mockPrismaService.sale.findMany.mockResolvedValue([]);

      const result = await service.getDailyReport(tenantId, {});

      expect(result.totalSales).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.totalItemsSold).toBe(0);
    });
  });

  describe('getTopMedicines', () => {
    const tenantId = 'tenant-1';

    it('should return top 10 medicines sorted by quantity desc', async () => {
      const saleItems = [
        { medicineId: 'm1', quantity: 20, medicine: { id: 'm1', name: 'Med A' } },
        { medicineId: 'm2', quantity: 50, medicine: { id: 'm2', name: 'Med B' } },
        { medicineId: 'm1', quantity: 30, medicine: { id: 'm1', name: 'Med A' } },
        { medicineId: 'm3', quantity: 10, medicine: { id: 'm3', name: 'Med C' } },
      ];

      mockPrismaService.saleItem.findMany.mockResolvedValue(saleItems);

      const result = await service.getTopMedicines(tenantId, {});

      expect(result).toHaveLength(3);
      expect(result[0].medicineName).toBe('Med A');
      expect(result[0].totalQuantity).toBe(50);
      expect(result[1].medicineName).toBe('Med B');
      expect(result[1].totalQuantity).toBe(50);
    });

    it('should limit results to 10', async () => {
      const saleItems = Array.from({ length: 15 }, (_, i) => ({
        medicineId: `m${i}`,
        quantity: 10,
        medicine: { id: `m${i}`, name: `Med ${i}` },
      }));

      mockPrismaService.saleItem.findMany.mockResolvedValue(saleItems);

      const result = await service.getTopMedicines(tenantId, {});

      expect(result).toHaveLength(10);
    });

    it('should filter by date range', async () => {
      mockPrismaService.saleItem.findMany.mockResolvedValue([]);

      await service.getTopMedicines(tenantId, {
        startDate: '2024-01-01',
        endDate: '2024-06-30',
      });

      expect(mockPrismaService.saleItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            createdAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-06-30'),
            },
          }),
        }),
      );
    });
  });

  describe('getWeeklySummary', () => {
    const tenantId = 'tenant-1';

    it('should return revenue, purchase cost, and net margin', async () => {
      const sales = [
        { finalAmount: 500 },
        { finalAmount: 300 },
      ];
      const purchases = [
        { totalCost: 200 },
        { totalCost: 150 },
      ];

      mockPrismaService.sale.findMany.mockResolvedValue(sales);
      mockPrismaService.purchaseRecord.findMany.mockResolvedValue(purchases);

      const result = await service.getWeeklySummary(tenantId, {
        startDate: '2024-06-10',
        endDate: '2024-06-16',
      });

      expect(result.totalRevenue).toBe(800);
      expect(result.totalPurchaseCost).toBe(350);
      expect(result.netMargin).toBe(450);
    });

    it('should default to current week when no dates provided', async () => {
      mockPrismaService.sale.findMany.mockResolvedValue([]);
      mockPrismaService.purchaseRecord.findMany.mockResolvedValue([]);

      const result = await service.getWeeklySummary(tenantId, {});

      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
      expect(result.totalRevenue).toBe(0);
      expect(result.totalPurchaseCost).toBe(0);
      expect(result.netMargin).toBe(0);
    });
  });

  describe('getPaymentBreakdown', () => {
    const tenantId = 'tenant-1';

    it('should return count and revenue per payment method', async () => {
      const sales = [
        { paymentMethod: 'CASH', finalAmount: 100 },
        { paymentMethod: 'CASH', finalAmount: 200 },
        { paymentMethod: 'CARD', finalAmount: 300 },
        { paymentMethod: 'ONLINE', finalAmount: 150 },
      ];

      mockPrismaService.sale.findMany.mockResolvedValue(sales);

      const result = await service.getPaymentBreakdown(tenantId, {});

      expect(result.CASH).toEqual({ count: 2, revenue: 300 });
      expect(result.CARD).toEqual({ count: 1, revenue: 300 });
      expect(result.ONLINE).toEqual({ count: 1, revenue: 150 });
    });

    it('should filter by date range', async () => {
      mockPrismaService.sale.findMany.mockResolvedValue([]);

      await service.getPaymentBreakdown(tenantId, {
        startDate: '2024-01-01',
        endDate: '2024-06-30',
      });

      expect(mockPrismaService.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            createdAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-06-30'),
            },
          }),
        }),
      );
    });

    it('should return zeros for unused payment methods', async () => {
      mockPrismaService.sale.findMany.mockResolvedValue([]);

      const result = await service.getPaymentBreakdown(tenantId, {});

      expect(result.CASH).toEqual({ count: 0, revenue: 0 });
      expect(result.CARD).toEqual({ count: 0, revenue: 0 });
      expect(result.ONLINE).toEqual({ count: 0, revenue: 0 });
    });
  });
});
