import { Test, TestingModule } from '@nestjs/testing';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Gender, AllergySeverity, DayOfWeek, AppointmentStatus } from '@prisma/client';

describe('DoctorController', () => {
  let controller: DoctorController;
  let service: DoctorService;

  const mockDoctorService = {
    createPatient: jest.fn(),
    listPatients: jest.fn(),
    createAllergyReport: jest.fn(),
    getPatientAllergyReports: jest.fn(),
    createPrescription: jest.fn(),
    dispatchToPharmacy: jest.fn(),
    requestConnection: jest.fn(),
    listConnections: jest.fn(),
    listPharmacies: jest.fn(),
    terminateConnection: jest.fn(),
    acceptConnection: jest.fn(),
    listAppointments: jest.fn(),
    setAvailability: jest.fn(),
    blockDate: jest.fn(),
    unblockDate: jest.fn(),
    setMaxAppointments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorController],
      providers: [
        { provide: DoctorService, useValue: mockDoctorService },
      ],
    }).compile();

    controller = module.get<DoctorController>(DoctorController);
    service = module.get<DoctorService>(DoctorService);
    jest.clearAllMocks();
  });

  const mockReq = {
    user: { sub: 'doctor-1', email: 'doc@test.com', role: 'DOCTOR', tenantId: 'tenant-1' },
  };

  describe('createPatient', () => {
    it('should call service with dto, userId, and tenantId', async () => {
      const dto = {
        name: 'Test Patient',
        email: 'patient@test.com',
        mobile: '1234567890',
        age: 25,
        gender: Gender.MALE,
      };
      const expected = { id: 'p1', ...dto, tenantId: 'tenant-1' };
      mockDoctorService.createPatient.mockResolvedValue(expected);

      const result = await controller.createPatient(dto, mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.createPatient).toHaveBeenCalledWith(
        dto,
        'doctor-1',
        'tenant-1',
      );
    });
  });

  describe('listPatients', () => {
    it('should call service with query and tenantId', async () => {
      const query = { page: 1, limit: 10 };
      const expected = { data: [], total: 0, page: 1, limit: 10 };
      mockDoctorService.listPatients.mockResolvedValue(expected);

      const result = await controller.listPatients(query, mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.listPatients).toHaveBeenCalledWith(
        query,
        'tenant-1',
      );
    });
  });

  describe('createAllergyReport', () => {
    it('should call service with dto, doctorId, and tenantId', async () => {
      const dto = {
        patientId: 'patient-1',
        allergyType: 'Peanut',
        symptoms: 'Hives',
        severity: AllergySeverity.HIGH,
      };
      const expected = { id: 'report-1', ...dto, tenantId: 'tenant-1' };
      mockDoctorService.createAllergyReport.mockResolvedValue(expected);

      const result = await controller.createAllergyReport(dto, mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.createAllergyReport).toHaveBeenCalledWith(
        dto,
        'doctor-1',
        'tenant-1',
      );
    });
  });

  describe('getPatientAllergyReports', () => {
    it('should call service with patientId and tenantId', async () => {
      const expected = [{ id: 'report-1' }];
      mockDoctorService.getPatientAllergyReports.mockResolvedValue(expected);

      const result = await controller.getPatientAllergyReports(
        'patient-1',
        mockReq,
      );

      expect(result).toEqual(expected);
      expect(mockDoctorService.getPatientAllergyReports).toHaveBeenCalledWith(
        'patient-1',
        'tenant-1',
      );
    });
  });

  describe('createPrescription', () => {
    it('should call service with dto, userId, and tenantId', async () => {
      const dto = {
        patientId: 'patient-1',
        items: [{ medicineName: 'Paracetamol', dosage: '500mg', frequency: 'twice daily', quantity: 10 }],
      };
      const expected = { id: 'rx-1', status: 'PENDING', ...dto, tenantId: 'tenant-1' };
      mockDoctorService.createPrescription.mockResolvedValue(expected);

      const result = await controller.createPrescription(dto, mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.createPrescription).toHaveBeenCalledWith(
        dto,
        'doctor-1',
        'tenant-1',
      );
    });
  });

  describe('dispatchToPharmacy', () => {
    it('should call service with prescriptionId, pharmacyId, userId, and tenantId', async () => {
      const expected = { id: 'rx-1', targetPharmacyId: 'pharmacy-1' };
      mockDoctorService.dispatchToPharmacy.mockResolvedValue(expected);

      const result = await controller.dispatchToPharmacy('rx-1', 'pharmacy-1', mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.dispatchToPharmacy).toHaveBeenCalledWith(
        'rx-1',
        'pharmacy-1',
        'doctor-1',
        'tenant-1',
      );
    });
  });

  describe('requestConnection', () => {
    it('should call service with dto, userId, and tenantId', async () => {
      const dto = { pharmacyId: 'pharmacy-1' };
      const expected = { id: 'conn-1', doctorId: 'doctor-1', pharmacyId: 'pharmacy-1', status: 'PENDING' };
      mockDoctorService.requestConnection.mockResolvedValue(expected);

      const result = await controller.requestConnection(dto, mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.requestConnection).toHaveBeenCalledWith(
        dto,
        'doctor-1',
        'tenant-1',
      );
    });
  });

  describe('listConnections', () => {
    it('should call service with doctorId', async () => {
      const expected = [{ id: 'conn-1', status: 'ACTIVE' }];
      mockDoctorService.listConnections.mockResolvedValue(expected);

      const result = await controller.listConnections(mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.listConnections).toHaveBeenCalledWith('doctor-1');
    });
  });

  describe('listPharmacies', () => {
    it('should call service with doctorId', async () => {
      const expected = [{ id: 'pharm-1', name: 'Pharmacy A', connectionStatus: null }];
      mockDoctorService.listPharmacies.mockResolvedValue(expected);

      const result = await controller.listPharmacies(mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.listPharmacies).toHaveBeenCalledWith('doctor-1');
    });
  });

  describe('terminateConnection', () => {
    it('should call service with connectionId and doctorId', async () => {
      const expected = { id: 'conn-1', status: 'INACTIVE' };
      mockDoctorService.terminateConnection.mockResolvedValue(expected);

      const result = await controller.terminateConnection('conn-1', mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.terminateConnection).toHaveBeenCalledWith('conn-1', 'doctor-1');
    });
  });

  describe('acceptConnection', () => {
    it('should call service with connectionId and pharmacyId', async () => {
      const pharmacyReq = {
        user: { sub: 'pharmacy-1', email: 'pharm@test.com', role: 'PHARMACY', tenantId: 'tenant-2' },
      };
      const expected = { id: 'conn-1', status: 'ACTIVE' };
      mockDoctorService.acceptConnection.mockResolvedValue(expected);

      const result = await controller.acceptConnection('conn-1', pharmacyReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.acceptConnection).toHaveBeenCalledWith('conn-1', 'pharmacy-1');
    });
  });

  describe('listAppointments', () => {
    it('should call service with query, doctorId, and tenantId', async () => {
      const query = { status: AppointmentStatus.SCHEDULED };
      const expected = { data: [], total: 0, page: 1, limit: 10 };
      mockDoctorService.listAppointments.mockResolvedValue(expected);

      const result = await controller.listAppointments(query, mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.listAppointments).toHaveBeenCalledWith(
        query,
        'doctor-1',
        'tenant-1',
      );
    });
  });

  describe('setAvailability', () => {
    it('should call service with dto, doctorId, and tenantId', async () => {
      const dto = {
        slots: [
          { dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '09:30' },
        ],
      };
      const expected = [{ id: 'sched-1', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '09:30' }];
      mockDoctorService.setAvailability.mockResolvedValue(expected);

      const result = await controller.setAvailability(dto, mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.setAvailability).toHaveBeenCalledWith(
        dto,
        'doctor-1',
        'tenant-1',
      );
    });
  });

  describe('blockDate', () => {
    it('should call service with dto, doctorId, and tenantId', async () => {
      const dto = { date: '2024-06-15' };
      const expected = { id: 'block-1', doctorId: 'doctor-1', date: '2024-06-15' };
      mockDoctorService.blockDate.mockResolvedValue(expected);

      const result = await controller.blockDate(dto, mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.blockDate).toHaveBeenCalledWith(
        dto,
        'doctor-1',
        'tenant-1',
      );
    });
  });

  describe('unblockDate', () => {
    it('should call service with date, doctorId, and tenantId', async () => {
      const expected = { message: 'Date unblocked successfully' };
      mockDoctorService.unblockDate.mockResolvedValue(expected);

      const result = await controller.unblockDate('2024-06-15', mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.unblockDate).toHaveBeenCalledWith(
        '2024-06-15',
        'doctor-1',
        'tenant-1',
      );
    });
  });

  describe('setMaxAppointments', () => {
    it('should call service with dto, doctorId, and tenantId', async () => {
      const dto = { maxPerDay: 20 };
      const expected = { doctorId: 'doctor-1', maxPerDay: 20, tenantId: 'tenant-1' };
      mockDoctorService.setMaxAppointments.mockResolvedValue(expected);

      const result = await controller.setMaxAppointments(dto, mockReq);

      expect(result).toEqual(expected);
      expect(mockDoctorService.setMaxAppointments).toHaveBeenCalledWith(
        dto,
        'doctor-1',
        'tenant-1',
      );
    });
  });
});
