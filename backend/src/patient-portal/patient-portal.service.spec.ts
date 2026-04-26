import { Test, TestingModule } from '@nestjs/testing';
import { PatientPortalService } from './patient-portal.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException } from '@nestjs/common';

describe('PatientPortalService - Prescriptions', () => {
  let service: PatientPortalService;

  const mockPrismaService = {
    patient: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    prescription: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    appointment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    doctorSchedule: {
      findMany: jest.fn(),
    },
    blockedDate: {
      findFirst: jest.fn(),
    },
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientPortalService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<PatientPortalService>(PatientPortalService);
    jest.clearAllMocks();
  });

  const userId = 'user-1';
  const patientRecord = {
    id: 'patient-1',
    name: 'Test Patient',
    email: 'test@example.com',
    createdBy: userId,
    tenantId: null,
  };

  describe('listPrescriptions', () => {
    beforeEach(() => {
      mockPrismaService.patient.findFirst.mockResolvedValue(patientRecord);
    });

    it('should return paginated prescriptions sorted by createdAt desc', async () => {
      const prescriptions = [
        {
          id: 'rx-1',
          patientId: 'patient-1',
          doctorId: 'doc-1',
          status: 'PENDING',
          targetPharmacyId: null,
          createdAt: new Date('2024-02-01'),
          doctor: { id: 'doc-1', name: 'Dr. Smith' },
          items: [
            {
              id: 'item-1',
              quantity: 10,
              dosage: '500mg',
              frequency: 'twice daily',
              medicine: { id: 'med-1', name: 'Paracetamol' },
            },
          ],
        },
        {
          id: 'rx-2',
          patientId: 'patient-1',
          doctorId: 'doc-2',
          status: 'DISPENSED',
          targetPharmacyId: null,
          createdAt: new Date('2024-01-01'),
          doctor: { id: 'doc-2', name: 'Dr. Jones' },
          items: [],
        },
      ];

      mockPrismaService.prescription.count.mockResolvedValue(2);
      mockPrismaService.prescription.findMany.mockResolvedValue(prescriptions);

      const result = await service.listPrescriptions({}, userId);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(mockPrismaService.prescription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
          where: { patientId: 'patient-1' },
        }),
      );
    });

    it('should include pharmacy info for dispatched prescriptions', async () => {
      const prescriptions = [
        {
          id: 'rx-1',
          patientId: 'patient-1',
          doctorId: 'doc-1',
          status: 'PENDING',
          targetPharmacyId: 'pharmacy-1',
          createdAt: new Date(),
          doctor: { id: 'doc-1', name: 'Dr. Smith' },
          items: [],
        },
      ];

      mockPrismaService.prescription.count.mockResolvedValue(1);
      mockPrismaService.prescription.findMany.mockResolvedValue(prescriptions);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'pharmacy-1',
        name: 'City Pharmacy',
      });

      const result = await service.listPrescriptions({}, userId);

      expect(result.data[0].pharmacy).toEqual({
        id: 'pharmacy-1',
        name: 'City Pharmacy',
      });
    });

    it('should set pharmacy to null when not dispatched', async () => {
      const prescriptions = [
        {
          id: 'rx-1',
          patientId: 'patient-1',
          doctorId: 'doc-1',
          status: 'PENDING',
          targetPharmacyId: null,
          createdAt: new Date(),
          doctor: { id: 'doc-1', name: 'Dr. Smith' },
          items: [],
        },
      ];

      mockPrismaService.prescription.count.mockResolvedValue(1);
      mockPrismaService.prescription.findMany.mockResolvedValue(prescriptions);

      const result = await service.listPrescriptions({}, userId);

      expect(result.data[0].pharmacy).toBeNull();
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.prescription.count.mockResolvedValue(25);
      mockPrismaService.prescription.findMany.mockResolvedValue([]);

      const result = await service.listPrescriptions(
        { page: 3, limit: 5 },
        userId,
      );

      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
      expect(mockPrismaService.prescription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        }),
      );
    });

    it('should create patient record if none exists', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        name: 'New Patient',
        email: 'new@example.com',
      });
      const newPatient = { ...patientRecord, id: 'new-patient-1' };
      mockPrismaService.patient.create.mockResolvedValue(newPatient);
      mockPrismaService.prescription.count.mockResolvedValue(0);
      mockPrismaService.prescription.findMany.mockResolvedValue([]);

      const result = await service.listPrescriptions({}, userId);

      expect(result.data).toHaveLength(0);
      expect(mockPrismaService.patient.create).toHaveBeenCalled();
    });
  });

  describe('getPrescriptionDetail', () => {
    beforeEach(() => {
      mockPrismaService.patient.findFirst.mockResolvedValue(patientRecord);
    });

    it('should return full prescription detail with items and doctor', async () => {
      const prescription = {
        id: 'rx-1',
        patientId: 'patient-1',
        doctorId: 'doc-1',
        status: 'PENDING',
        targetPharmacyId: null,
        createdAt: new Date(),
        doctor: { id: 'doc-1', name: 'Dr. Smith', email: 'doc@test.com' },
        items: [
          {
            id: 'item-1',
            quantity: 10,
            dosage: '500mg',
            frequency: 'twice daily',
            duration: '7 days',
            medicine: {
              id: 'med-1',
              name: 'Paracetamol',
              batchNumber: 'BATCH-001',
            },
          },
        ],
      };

      mockPrismaService.prescription.findFirst.mockResolvedValue(prescription);

      const result = await service.getPrescriptionDetail('rx-1', userId);

      expect(result.id).toBe('rx-1');
      expect(result.doctor.name).toBe('Dr. Smith');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].medicine.name).toBe('Paracetamol');
      expect(result.pharmacy).toBeNull();
    });

    it('should include pharmacy info when dispatched', async () => {
      const prescription = {
        id: 'rx-1',
        patientId: 'patient-1',
        doctorId: 'doc-1',
        status: 'DISPENSED',
        targetPharmacyId: 'pharmacy-1',
        createdAt: new Date(),
        doctor: { id: 'doc-1', name: 'Dr. Smith', email: 'doc@test.com' },
        items: [],
      };

      mockPrismaService.prescription.findFirst.mockResolvedValue(prescription);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'pharmacy-1',
        name: 'City Pharmacy',
      });

      const result = await service.getPrescriptionDetail('rx-1', userId);

      expect(result.pharmacy).toEqual({
        id: 'pharmacy-1',
        name: 'City Pharmacy',
      });
    });

    it('should throw NotFoundException if prescription not found', async () => {
      mockPrismaService.prescription.findFirst.mockResolvedValue(null);

      await expect(
        service.getPrescriptionDetail('rx-999', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if prescription belongs to another patient', async () => {
      // findFirst with patientId filter will return null for wrong patient
      mockPrismaService.prescription.findFirst.mockResolvedValue(null);

      await expect(
        service.getPrescriptionDetail('rx-other', userId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
