import { Test, TestingModule } from '@nestjs/testing';
import { DoctorService } from './doctor.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Gender, AllergySeverity, Prisma, AppointmentStatus, DayOfWeek } from '@prisma/client';

describe('DoctorService', () => {
  let service: DoctorService;

  const mockPrismaService = {
    patient: {
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    allergyReport: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    medicine: {
      findFirst: jest.fn(),
    },
    prescription: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    doctorPharmacyConnection: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    appointment: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    doctorSchedule: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    blockedDate: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<DoctorService>(DoctorService);
    jest.clearAllMocks();
  });

  describe('createPatient', () => {
    const tenantId = 'tenant-1';
    const userId = 'doctor-1';
    const dto = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      mobile: '1234567890',
      age: 30,
      gender: Gender.FEMALE,
    };

    it('should create a patient successfully', async () => {
      const created = {
        id: 'patient-1',
        ...dto,
        medicalHistory: null,
        createdBy: userId,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.patient.findFirst.mockResolvedValue(null);
      mockPrismaService.patient.create.mockResolvedValue(created);

      const result = await service.createPatient(dto, userId, tenantId);

      expect(result.id).toBe('patient-1');
      expect(result.name).toBe('Jane Doe');
      expect(result.tenantId).toBe(tenantId);
      expect(mockPrismaService.patient.create).toHaveBeenCalledWith({
        data: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          mobile: '1234567890',
          age: 30,
          gender: Gender.FEMALE,
          medicalHistory: null,
          createdBy: userId,
          tenantId,
        },
      });
    });

    it('should throw ConflictException if email already exists in tenant', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue({
        id: 'existing',
        email: dto.email,
        tenantId,
      });

      await expect(
        service.createPatient(dto, userId, tenantId),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.patient.create).not.toHaveBeenCalled();
    });

    it('should allow creating patient without email', async () => {
      const noEmailDto = { name: 'No Email', age: 25, gender: Gender.MALE };
      const created = {
        id: 'patient-2',
        name: 'No Email',
        email: null,
        mobile: null,
        age: 25,
        gender: Gender.MALE,
        medicalHistory: null,
        createdBy: userId,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.patient.create.mockResolvedValue(created);

      const result = await service.createPatient(noEmailDto, userId, tenantId);

      expect(result.email).toBeNull();
      // findFirst should not be called when no email
      expect(mockPrismaService.patient.findFirst).not.toHaveBeenCalled();
    });

    it('should throw ConflictException on Prisma unique constraint violation', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue(null);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      mockPrismaService.patient.create.mockRejectedValue(prismaError);

      await expect(
        service.createPatient(dto, userId, tenantId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('listPatients', () => {
    const tenantId = 'tenant-1';

    it('should return paginated patients sorted by createdAt desc', async () => {
      const patients = [
        { id: 'p1', name: 'A', createdAt: new Date('2024-02-01') },
        { id: 'p2', name: 'B', createdAt: new Date('2024-01-01') },
      ];

      mockPrismaService.patient.count.mockResolvedValue(2);
      mockPrismaService.patient.findMany.mockResolvedValue(patients);

      const result = await service.listPatients({}, tenantId);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(mockPrismaService.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
          where: { tenantId },
        }),
      );
    });

    it('should apply search filter across name, email, and mobile', async () => {
      mockPrismaService.patient.count.mockResolvedValue(0);
      mockPrismaService.patient.findMany.mockResolvedValue([]);

      await service.listPatients({ search: 'john' }, tenantId);

      expect(mockPrismaService.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId,
            OR: [
              { name: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
              { mobile: { contains: 'john', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.patient.count.mockResolvedValue(25);
      mockPrismaService.patient.findMany.mockResolvedValue([]);

      const result = await service.listPatients(
        { page: 3, limit: 5 },
        tenantId,
      );

      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
      expect(mockPrismaService.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        }),
      );
    });
  });

  describe('createAllergyReport', () => {
    const tenantId = 'tenant-1';
    const doctorId = 'doctor-1';
    const dto = {
      patientId: 'patient-1',
      allergyType: 'Peanut',
      symptoms: 'Hives, swelling',
      severity: AllergySeverity.HIGH,
      notes: 'Avoid all peanut products',
    };

    it('should create an allergy report successfully', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue({
        id: 'patient-1',
        tenantId,
      });
      const created = {
        id: 'report-1',
        ...dto,
        doctorId,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.allergyReport.create.mockResolvedValue(created);

      const result = await service.createAllergyReport(dto, doctorId, tenantId);

      expect(result.id).toBe('report-1');
      expect(result.severity).toBe(AllergySeverity.HIGH);
      expect(mockPrismaService.allergyReport.create).toHaveBeenCalledWith({
        data: {
          patientId: dto.patientId,
          doctorId,
          allergyType: dto.allergyType,
          symptoms: dto.symptoms,
          severity: dto.severity,
          notes: dto.notes,
          tenantId,
        },
      });
    });

    it('should throw ForbiddenException if patient does not belong to tenant', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.createAllergyReport(dto, doctorId, tenantId),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.allergyReport.create).not.toHaveBeenCalled();
    });

    it('should create report with null notes when not provided', async () => {
      const noNotesDto = { ...dto, notes: undefined };
      mockPrismaService.patient.findFirst.mockResolvedValue({
        id: 'patient-1',
        tenantId,
      });
      const created = {
        id: 'report-2',
        ...noNotesDto,
        notes: null,
        doctorId,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.allergyReport.create.mockResolvedValue(created);

      const result = await service.createAllergyReport(
        noNotesDto,
        doctorId,
        tenantId,
      );

      expect(result.notes).toBeNull();
      expect(mockPrismaService.allergyReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ notes: null }),
      });
    });
  });

  describe('getPatientAllergyReports', () => {
    const tenantId = 'tenant-1';
    const patientId = 'patient-1';

    it('should return allergy reports sorted by createdAt desc', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue({
        id: patientId,
        tenantId,
      });
      const reports = [
        { id: 'r1', createdAt: new Date('2024-02-01') },
        { id: 'r2', createdAt: new Date('2024-01-01') },
      ];
      mockPrismaService.allergyReport.findMany.mockResolvedValue(reports);

      const result = await service.getPatientAllergyReports(
        patientId,
        tenantId,
      );

      expect(result).toHaveLength(2);
      expect(mockPrismaService.allergyReport.findMany).toHaveBeenCalledWith({
        where: { patientId, tenantId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw ForbiddenException if patient does not belong to tenant', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.getPatientAllergyReports(patientId, tenantId),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.allergyReport.findMany).not.toHaveBeenCalled();
    });
  });

  describe('createPrescription', () => {
    const tenantId = 'tenant-1';
    const doctorId = 'doctor-1';
    const dto = {
      patientId: 'patient-1',
      items: [
        { medicineName: 'Paracetamol', dosage: '500mg', frequency: 'twice daily', quantity: 10 },
      ],
    };

    it('should create a prescription with status PENDING', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: 'patient-1', tenantId });
      mockPrismaService.medicine.findFirst.mockResolvedValue({ id: 'med-1', name: 'Paracetamol', tenantId });
      const created = {
        id: 'rx-1',
        patientId: 'patient-1',
        doctorId,
        status: 'PENDING',
        tenantId,
        targetPharmacyId: null,
        items: [{ id: 'item-1', medicineId: 'med-1', quantity: 10, dosage: '500mg', frequency: 'twice daily' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.prescription.create.mockResolvedValue(created);

      const result = await service.createPrescription(dto, doctorId, tenantId);

      expect(result.status).toBe('PENDING');
      expect(result.items).toHaveLength(1);
      expect(mockPrismaService.prescription.create).toHaveBeenCalledWith({
        data: {
          patientId: 'patient-1',
          doctorId,
          status: 'PENDING',
          tenantId,
          targetPharmacyId: null,
          items: {
            create: [{ medicineId: 'med-1', quantity: 10, dosage: '500mg', frequency: 'twice daily' }],
          },
        },
        include: { items: true },
      });
    });

    it('should throw ForbiddenException if patient does not belong to tenant', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.createPrescription(dto, doctorId, tenantId),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.prescription.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if medicine not found in tenant', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: 'patient-1', tenantId });
      mockPrismaService.medicine.findFirst.mockResolvedValue(null);

      await expect(
        service.createPrescription(dto, doctorId, tenantId),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.prescription.create).not.toHaveBeenCalled();
    });

    it('should set targetPharmacyId when provided and active connection + pharmacy role exist', async () => {
      const dtoWithPharmacy = { ...dto, targetPharmacyId: 'pharmacy-1' };
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: 'patient-1', tenantId });
      // Mock active connection check (sub-task 1.1)
      mockPrismaService.doctorPharmacyConnection.findFirst.mockResolvedValue({
        id: 'conn-1', doctorId, pharmacyId: 'pharmacy-1', status: 'ACTIVE',
      });
      // Mock pharmacy role check (sub-task 1.2)
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'pharmacy-1', role: 'PHARMACY',
      });
      mockPrismaService.medicine.findFirst.mockResolvedValue({ id: 'med-1', name: 'Paracetamol', tenantId });
      const created = {
        id: 'rx-2',
        patientId: 'patient-1',
        doctorId,
        status: 'PENDING',
        tenantId,
        targetPharmacyId: 'pharmacy-1',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.prescription.create.mockResolvedValue(created);

      const result = await service.createPrescription(dtoWithPharmacy, doctorId, tenantId);

      expect(result.targetPharmacyId).toBe('pharmacy-1');
      expect(mockPrismaService.prescription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ targetPharmacyId: 'pharmacy-1' }),
        }),
      );
    });

    it('should throw BadRequestException when no active connection exists with target pharmacy', async () => {
      const dtoWithPharmacy = { ...dto, targetPharmacyId: 'pharmacy-1' };
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: 'patient-1', tenantId });
      // No active connection found
      mockPrismaService.doctorPharmacyConnection.findFirst.mockResolvedValue(null);

      await expect(
        service.createPrescription(dtoWithPharmacy, doctorId, tenantId),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.prescription.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when targetPharmacyId does not belong to a PHARMACY user', async () => {
      const dtoWithPharmacy = { ...dto, targetPharmacyId: 'not-a-pharmacy' };
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: 'patient-1', tenantId });
      // Active connection exists
      mockPrismaService.doctorPharmacyConnection.findFirst.mockResolvedValue({
        id: 'conn-1', doctorId, pharmacyId: 'not-a-pharmacy', status: 'ACTIVE',
      });
      // But the user is not a PHARMACY role
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.createPrescription(dtoWithPharmacy, doctorId, tenantId),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.prescription.create).not.toHaveBeenCalled();
    });

    it('should skip connection and role checks when targetPharmacyId is absent (draft path)', async () => {
      // dto has no targetPharmacyId — draft path
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: 'patient-1', tenantId });
      mockPrismaService.medicine.findFirst.mockResolvedValue({ id: 'med-1', name: 'Paracetamol', tenantId });
      const created = {
        id: 'rx-draft',
        patientId: 'patient-1',
        doctorId,
        status: 'PENDING',
        tenantId,
        targetPharmacyId: null,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.prescription.create.mockResolvedValue(created);

      const result = await service.createPrescription(dto, doctorId, tenantId);

      expect(result.targetPharmacyId).toBeNull();
      // Connection and user checks should NOT have been called
      expect(mockPrismaService.doctorPharmacyConnection.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.user.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('dispatchToPharmacy', () => {
    const tenantId = 'tenant-1';
    const doctorId = 'doctor-1';
    const prescriptionId = 'rx-1';
    const pharmacyId = 'pharmacy-1';

    it('should dispatch prescription when active connection exists', async () => {
      mockPrismaService.prescription.findFirst.mockResolvedValue({
        id: prescriptionId,
        doctorId,
        tenantId,
        patient: { id: 'patient-1', name: 'Jane Doe' },
      });
      mockPrismaService.doctorPharmacyConnection.findFirst.mockResolvedValue({
        id: 'conn-1',
        doctorId,
        pharmacyId,
        status: 'ACTIVE',
      });
      const updated = {
        id: prescriptionId,
        targetPharmacyId: pharmacyId,
        items: [],
        patient: { id: 'patient-1', name: 'Jane Doe' },
        doctor: { id: doctorId, name: 'Dr. Smith' },
      };
      mockPrismaService.prescription.update.mockResolvedValue(updated);
      mockPrismaService.user.findFirst.mockResolvedValue({ id: doctorId, name: 'Dr. Smith' });
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.dispatchToPharmacy(prescriptionId, pharmacyId, doctorId, tenantId);

      expect(result.targetPharmacyId).toBe(pharmacyId);
      expect(mockPrismaService.prescription.update).toHaveBeenCalledWith({
        where: { id: prescriptionId },
        data: { targetPharmacyId: pharmacyId },
        include: { items: true, patient: true, doctor: true },
      });
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        pharmacyId,
        'PRESCRIPTION_DISPATCHED',
        expect.stringContaining(prescriptionId),
      );
    });

    it('should throw NotFoundException if prescription not found', async () => {
      mockPrismaService.prescription.findFirst.mockResolvedValue(null);

      await expect(
        service.dispatchToPharmacy(prescriptionId, pharmacyId, doctorId, tenantId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no active connection exists', async () => {
      mockPrismaService.prescription.findFirst.mockResolvedValue({
        id: prescriptionId,
        doctorId,
        tenantId,
        patient: { id: 'patient-1', name: 'Jane Doe' },
      });
      mockPrismaService.doctorPharmacyConnection.findFirst.mockResolvedValue(null);

      await expect(
        service.dispatchToPharmacy(prescriptionId, pharmacyId, doctorId, tenantId),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.prescription.update).not.toHaveBeenCalled();
    });
  });

  describe('requestConnection', () => {
    const tenantId = 'tenant-1';
    const doctorId = 'doctor-1';
    const dto = { pharmacyId: 'pharmacy-1' };

    it('should create a connection with status PENDING', async () => {
      const created = {
        id: 'conn-1',
        doctorId,
        pharmacyId: dto.pharmacyId,
        status: 'PENDING',
        tenantId,
        pharmacy: { id: 'pharmacy-1', name: 'Pharmacy A', email: 'pharm@test.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.doctorPharmacyConnection.create.mockResolvedValue(created);

      const result = await service.requestConnection(dto, doctorId, tenantId);

      expect(result.status).toBe('PENDING');
      expect(result.doctorId).toBe(doctorId);
      expect(result.pharmacyId).toBe(dto.pharmacyId);
      expect(mockPrismaService.doctorPharmacyConnection.create).toHaveBeenCalledWith({
        data: {
          doctorId,
          pharmacyId: dto.pharmacyId,
          status: 'PENDING',
          tenantId,
        },
        include: { pharmacy: { select: { id: true, name: true, email: true } } },
      });
    });

    it('should throw ConflictException on duplicate connection (P2002)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      mockPrismaService.doctorPharmacyConnection.create.mockRejectedValue(prismaError);

      await expect(
        service.requestConnection(dto, doctorId, tenantId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('listConnections', () => {
    const doctorId = 'doctor-1';

    it('should return connections sorted by createdAt desc', async () => {
      const connections = [
        { id: 'conn-1', status: 'ACTIVE', createdAt: new Date('2024-02-01') },
        { id: 'conn-2', status: 'PENDING', createdAt: new Date('2024-01-01') },
      ];
      mockPrismaService.doctorPharmacyConnection.findMany.mockResolvedValue(connections);

      const result = await service.listConnections(doctorId);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.doctorPharmacyConnection.findMany).toHaveBeenCalledWith({
        where: { doctorId },
        include: { pharmacy: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('listPharmacies', () => {
    const doctorId = 'doctor-1';

    it('should return pharmacies with connection status', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'pharm-1', name: 'Pharmacy A', email: 'a@test.com' },
        { id: 'pharm-2', name: 'Pharmacy B', email: 'b@test.com' },
      ]);
      mockPrismaService.doctorPharmacyConnection.findMany.mockResolvedValue([
        { pharmacyId: 'pharm-1', status: 'ACTIVE' },
      ]);

      const result = await service.listPharmacies(doctorId);

      expect(result).toHaveLength(2);
      expect(result[0].connectionStatus).toBe('ACTIVE');
      expect(result[1].connectionStatus).toBeNull();
    });
  });

  describe('terminateConnection', () => {
    const doctorId = 'doctor-1';

    it('should set connection status to INACTIVE', async () => {
      mockPrismaService.doctorPharmacyConnection.findFirst.mockResolvedValue({
        id: 'conn-1',
        doctorId,
        status: 'ACTIVE',
      });
      const updated = {
        id: 'conn-1',
        status: 'INACTIVE',
        pharmacy: { id: 'pharm-1', name: 'Pharmacy A', email: 'a@test.com' },
      };
      mockPrismaService.doctorPharmacyConnection.update.mockResolvedValue(updated);

      const result = await service.terminateConnection('conn-1', doctorId);

      expect(result.status).toBe('INACTIVE');
      expect(mockPrismaService.doctorPharmacyConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: { status: 'INACTIVE' },
        include: { pharmacy: { select: { id: true, name: true, email: true } } },
      });
    });

    it('should throw NotFoundException if connection not found', async () => {
      mockPrismaService.doctorPharmacyConnection.findFirst.mockResolvedValue(null);

      await expect(
        service.terminateConnection('conn-999', doctorId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('acceptConnection', () => {
    const pharmacyId = 'pharmacy-1';

    it('should update PENDING connection to ACTIVE', async () => {
      mockPrismaService.doctorPharmacyConnection.findFirst.mockResolvedValue({
        id: 'conn-1',
        pharmacyId,
        status: 'PENDING',
      });
      const updated = {
        id: 'conn-1',
        status: 'ACTIVE',
        doctor: { id: 'doctor-1', name: 'Dr. Smith', email: 'doc@test.com' },
        pharmacy: { id: pharmacyId, name: 'Pharmacy A', email: 'pharm@test.com' },
      };
      mockPrismaService.doctorPharmacyConnection.update.mockResolvedValue(updated);

      const result = await service.acceptConnection('conn-1', pharmacyId);

      expect(result.status).toBe('ACTIVE');
      expect(mockPrismaService.doctorPharmacyConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: { status: 'ACTIVE' },
        include: {
          doctor: { select: { id: true, name: true, email: true } },
          pharmacy: { select: { id: true, name: true, email: true } },
        },
      });
    });

    it('should throw NotFoundException if no pending connection found', async () => {
      mockPrismaService.doctorPharmacyConnection.findFirst.mockResolvedValue(null);

      await expect(
        service.acceptConnection('conn-999', pharmacyId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listAppointments', () => {
    const tenantId = 'tenant-1';
    const doctorId = 'doctor-1';

    it('should return appointments sorted by date asc', async () => {
      const appointments = [
        { 
          id: 'apt-1', 
          date: new Date('2024-01-01'), 
          status: 'SCHEDULED', 
          isRescheduled: false,
          tags: [],
          patient: { id: 'p1', name: 'A' } 
        },
        { 
          id: 'apt-2', 
          date: new Date('2024-01-02'), 
          status: 'SCHEDULED', 
          isRescheduled: false,
          tags: [],
          patient: { id: 'p2', name: 'B' } 
        },
      ];
      mockPrismaService.appointment.count.mockResolvedValue(2);
      mockPrismaService.appointment.findMany.mockResolvedValue(appointments);

      const result = await service.listAppointments({}, doctorId, tenantId);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { date: 'asc' },
          where: { doctorId, tenantId },
          select: expect.objectContaining({
            id: true,
            patientId: true,
            doctorId: true,
            date: true,
            timeSlot: true,
            status: true,
            isRescheduled: true,
            tags: true,
            tenantId: true,
            createdAt: true,
            updatedAt: true,
            patient: {
              select: {
                id: true,
                name: true,
              },
            },
          }),
        }),
      );
    });

    it('should include overdue indicator in appointment responses', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      const appointments = [
        { 
          id: 'apt-1', 
          date: pastDate, 
          timeSlot: '10:00 AM',
          status: 'SCHEDULED',
          isRescheduled: false,
          tags: [],
          patient: { id: 'p1', name: 'Patient A' } 
        },
        { 
          id: 'apt-2', 
          date: futureDate, 
          timeSlot: '2:00 PM',
          status: 'SCHEDULED',
          isRescheduled: false,
          tags: [],
          patient: { id: 'p2', name: 'Patient B' } 
        },
        { 
          id: 'apt-3', 
          date: pastDate, 
          timeSlot: '3:00 PM',
          status: 'COMPLETED',
          isRescheduled: true,
          tags: ['Rescheduled'],
          patient: { id: 'p3', name: 'Patient C' } 
        },
      ];
      
      mockPrismaService.appointment.count.mockResolvedValue(3);
      mockPrismaService.appointment.findMany.mockResolvedValue(appointments);

      const result = await service.listAppointments({}, doctorId, tenantId);

      expect(result.data).toHaveLength(3);
      
      // Past SCHEDULED appointment should be overdue
      expect(result.data[0].isOverdue).toBe(true);
      
      // Future SCHEDULED appointment should not be overdue
      expect(result.data[1].isOverdue).toBe(false);
      
      // Past COMPLETED appointment should not be overdue (only SCHEDULED can be overdue)
      expect(result.data[2].isOverdue).toBe(false);
    });

    it('should handle different time formats in overdue detection', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      const appointments = [
        { 
          id: 'apt-1', 
          date: pastDate, 
          timeSlot: '14:00', // 24-hour format
          status: 'SCHEDULED',
          isRescheduled: false,
          tags: [],
          patient: { id: 'p1', name: 'Patient A' } 
        },
        { 
          id: 'apt-2', 
          date: pastDate, 
          timeSlot: '2:00 PM', // AM/PM format
          status: 'SCHEDULED',
          isRescheduled: true,
          tags: ['Rescheduled'],
          patient: { id: 'p2', name: 'Patient B' } 
        },
        { 
          id: 'apt-3', 
          date: pastDate, 
          timeSlot: null, // Invalid timeSlot
          status: 'SCHEDULED',
          isRescheduled: false,
          tags: [],
          patient: { id: 'p3', name: 'Patient C' } 
        },
      ];
      
      mockPrismaService.appointment.count.mockResolvedValue(3);
      mockPrismaService.appointment.findMany.mockResolvedValue(appointments);

      const result = await service.listAppointments({}, doctorId, tenantId);

      expect(result.data).toHaveLength(3);
      
      // Both valid time formats should be detected as overdue
      expect(result.data[0].isOverdue).toBe(true);
      expect(result.data[1].isOverdue).toBe(true);
      
      // Invalid timeSlot should not be overdue (safety check)
      expect(result.data[2].isOverdue).toBe(false);
    });

    it('should include isRescheduled and tags fields in response', async () => {
      const appointments = [
        { 
          id: 'apt-1', 
          date: new Date('2024-01-01'), 
          timeSlot: '10:00 AM',
          status: 'SCHEDULED',
          isRescheduled: true,
          tags: ['Rescheduled'],
          patient: { id: 'p1', name: 'Patient A' } 
        },
        { 
          id: 'apt-2', 
          date: new Date('2024-01-02'), 
          timeSlot: '2:00 PM',
          status: 'SCHEDULED',
          isRescheduled: false,
          tags: [],
          patient: { id: 'p2', name: 'Patient B' } 
        },
      ];
      mockPrismaService.appointment.count.mockResolvedValue(2);
      mockPrismaService.appointment.findMany.mockResolvedValue(appointments);

      const result = await service.listAppointments({}, doctorId, tenantId);

      expect(result.data).toHaveLength(2);
      
      // Check first appointment has rescheduled flag and tag
      expect(result.data[0].isRescheduled).toBe(true);
      expect(result.data[0].tags).toEqual(['Rescheduled']);
      
      // Check second appointment has default values
      expect(result.data[1].isRescheduled).toBe(false);
      expect(result.data[1].tags).toEqual([]);
    });

    it('should filter by status', async () => {
      mockPrismaService.appointment.count.mockResolvedValue(0);
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      await service.listAppointments(
        { status: AppointmentStatus.SCHEDULED },
        doctorId,
        tenantId,
      );

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { doctorId, tenantId, status: 'SCHEDULED' },
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.appointment.count.mockResolvedValue(0);
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      await service.listAppointments(
        { startDate: '2024-01-01', endDate: '2024-01-31' },
        doctorId,
        tenantId,
      );

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            doctorId,
            tenantId,
            date: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31'),
            },
          },
        }),
      );
    });
  });

  describe('setAvailability', () => {
    const tenantId = 'tenant-1';
    const doctorId = 'doctor-1';

    it('should delete existing schedules and create new ones', async () => {
      mockPrismaService.doctorSchedule.deleteMany.mockResolvedValue({ count: 2 });
      const slot1 = {
        id: 'sched-1',
        doctorId,
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '09:00',
        endTime: '09:30',
        tenantId,
      };
      const slot2 = {
        id: 'sched-2',
        doctorId,
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '09:30',
        endTime: '10:00',
        tenantId,
      };
      mockPrismaService.doctorSchedule.create
        .mockResolvedValueOnce(slot1)
        .mockResolvedValueOnce(slot2);

      const dto = {
        slots: [
          { dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '09:30' },
          { dayOfWeek: DayOfWeek.MONDAY, startTime: '09:30', endTime: '10:00' },
        ],
      };

      const result = await service.setAvailability(dto, doctorId, tenantId);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.doctorSchedule.deleteMany).toHaveBeenCalledWith({
        where: { doctorId, tenantId },
      });
      expect(mockPrismaService.doctorSchedule.create).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when no slots provided', async () => {
      mockPrismaService.doctorSchedule.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.setAvailability({ slots: [] }, doctorId, tenantId);

      expect(result).toEqual([]);
      expect(mockPrismaService.doctorSchedule.create).not.toHaveBeenCalled();
    });
  });

  describe('blockDate', () => {
    const tenantId = 'tenant-1';
    const doctorId = 'doctor-1';

    it('should create a blocked date', async () => {
      const blocked = {
        id: 'block-1',
        doctorId,
        date: new Date('2024-06-15'),
        tenantId,
      };
      mockPrismaService.blockedDate.create.mockResolvedValue(blocked);

      const result = await service.blockDate({ date: '2024-06-15' }, doctorId, tenantId);

      expect(result.id).toBe('block-1');
      expect(mockPrismaService.blockedDate.create).toHaveBeenCalledWith({
        data: {
          doctorId,
          date: new Date('2024-06-15'),
          tenantId,
        },
      });
    });

    it('should throw ConflictException if date already blocked', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      mockPrismaService.blockedDate.create.mockRejectedValue(prismaError);

      await expect(
        service.blockDate({ date: '2024-06-15' }, doctorId, tenantId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('unblockDate', () => {
    const tenantId = 'tenant-1';
    const doctorId = 'doctor-1';

    it('should delete the blocked date', async () => {
      mockPrismaService.blockedDate.findFirst.mockResolvedValue({
        id: 'block-1',
        doctorId,
        date: new Date('2024-06-15'),
        tenantId,
      });
      mockPrismaService.blockedDate.delete.mockResolvedValue({});

      const result = await service.unblockDate('2024-06-15', doctorId, tenantId);

      expect(result.message).toBe('Date unblocked successfully');
      expect(mockPrismaService.blockedDate.delete).toHaveBeenCalledWith({
        where: { id: 'block-1' },
      });
    });

    it('should throw NotFoundException if blocked date not found', async () => {
      mockPrismaService.blockedDate.findFirst.mockResolvedValue(null);

      await expect(
        service.unblockDate('2024-06-15', doctorId, tenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setMaxAppointments', () => {
    const tenantId = 'tenant-1';
    const doctorId = 'doctor-1';

    it('should return the max appointments config', async () => {
      const result = await service.setMaxAppointments(
        { maxPerDay: 20 },
        doctorId,
        tenantId,
      );

      expect(result.doctorId).toBe(doctorId);
      expect(result.maxPerDay).toBe(20);
      expect(result.tenantId).toBe(tenantId);
    });
  });

  describe('cancelAppointment', () => {
    const tenantId = 'tenant-1';
    const doctorId = 'doctor-1';
    const appointmentId = 'appointment-1';

    it('should cancel appointment successfully', async () => {
      const mockAppointment = {
        id: appointmentId,
        doctorId,
        tenantId,
        status: 'SCHEDULED',
        patient: { id: 'patient-1', name: 'John Doe' },
      };

      mockPrismaService.appointment.findFirst.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: 'CANCELLED',
      });

      const result = await service.cancelAppointment(
        appointmentId,
        doctorId,
        tenantId,
      );

      expect(result.message).toBe('Appointment cancelled successfully');
      expect(mockPrismaService.appointment.findFirst).toHaveBeenCalledWith({
        where: { id: appointmentId, doctorId, tenantId },
        include: { patient: { select: { id: true, name: true } } },
      });
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: { status: 'CANCELLED', updatedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if appointment not found', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);

      await expect(
        service.cancelAppointment(appointmentId, doctorId, tenantId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if appointment is already cancelled', async () => {
      const mockAppointment = {
        id: appointmentId,
        doctorId,
        tenantId,
        status: 'CANCELLED',
        patient: { id: 'patient-1', name: 'John Doe' },
      };

      mockPrismaService.appointment.findFirst.mockResolvedValue(mockAppointment);

      await expect(
        service.cancelAppointment(appointmentId, doctorId, tenantId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
