import { Test, TestingModule } from '@nestjs/testing';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { AppointmentStatus } from '@prisma/client';

describe('PatientController', () => {
  let controller: PatientController;
  let service: PatientService;

  const mockPatientService = {
    bookAppointment: jest.fn(),
    listAppointments: jest.fn(),
    cancelAppointment: jest.fn(),
    rescheduleAppointment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientController],
      providers: [
        {
          provide: PatientService,
          useValue: mockPatientService,
        },
      ],
    }).compile();

    controller = module.get<PatientController>(PatientController);
    service = module.get<PatientService>(PatientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cancelAppointment', () => {
    const mockRequest = {
      user: {
        sub: 'patient-123',
        tenantId: 'tenant-123',
      },
    };

    it('should successfully cancel an appointment', async () => {
      const appointmentId = 'appointment-123';
      mockPatientService.cancelAppointment.mockResolvedValue(undefined);

      await controller.cancelAppointment(appointmentId, mockRequest);

      expect(mockPatientService.cancelAppointment).toHaveBeenCalledWith(
        appointmentId,
        'patient-123',
        'tenant-123',
      );
    });

    it('should pass the correct appointment ID to the service', async () => {
      const appointmentId = 'test-appointment-456';
      mockPatientService.cancelAppointment.mockResolvedValue(undefined);

      await controller.cancelAppointment(appointmentId, mockRequest);

      expect(mockPatientService.cancelAppointment).toHaveBeenCalledWith(
        appointmentId,
        mockRequest.user.sub,
        mockRequest.user.tenantId,
      );
    });

    it('should extract patient ID from JWT token', async () => {
      const appointmentId = 'appointment-123';
      const customRequest = {
        user: {
          sub: 'different-patient-789',
          tenantId: 'tenant-123',
        },
      };
      mockPatientService.cancelAppointment.mockResolvedValue(undefined);

      await controller.cancelAppointment(appointmentId, customRequest);

      expect(mockPatientService.cancelAppointment).toHaveBeenCalledWith(
        appointmentId,
        'different-patient-789',
        'tenant-123',
      );
    });

    it('should extract tenant ID from JWT token', async () => {
      const appointmentId = 'appointment-123';
      const customRequest = {
        user: {
          sub: 'patient-123',
          tenantId: 'different-tenant-456',
        },
      };
      mockPatientService.cancelAppointment.mockResolvedValue(undefined);

      await controller.cancelAppointment(appointmentId, customRequest);

      expect(mockPatientService.cancelAppointment).toHaveBeenCalledWith(
        appointmentId,
        'patient-123',
        'different-tenant-456',
      );
    });

    it('should propagate service errors to the caller', async () => {
      const appointmentId = 'appointment-123';
      const error = new Error('Cannot cancel appointment within 30 minutes of scheduled time');
      mockPatientService.cancelAppointment.mockRejectedValue(error);

      await expect(
        controller.cancelAppointment(appointmentId, mockRequest),
      ).rejects.toThrow(error);
    });
  });

  describe('bookAppointment', () => {
    const mockRequest = {
      user: {
        sub: 'patient-123',
        tenantId: 'tenant-123',
      },
    };

    it('should successfully book an appointment', async () => {
      const bookingDto = {
        doctorId: 'doctor-123',
        date: '2025-05-15',
        timeSlot: '2:00 PM',
      };

      const mockAppointment = {
        id: 'appointment-123',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: new Date('2025-05-15'),
        timeSlot: '2:00 PM',
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
        isRescheduled: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        patient: { id: 'patient-123', name: 'John Doe' },
        doctor: { id: 'doctor-123', name: 'Dr. Smith' },
      };

      mockPatientService.bookAppointment.mockResolvedValue(mockAppointment);

      const result = await controller.bookAppointment(bookingDto, mockRequest);

      expect(result).toEqual(mockAppointment);
      expect(mockPatientService.bookAppointment).toHaveBeenCalledWith(
        bookingDto,
        'patient-123',
        'tenant-123',
      );
    });
  });

  describe('listAppointments', () => {
    const mockRequest = {
      user: {
        sub: 'patient-123',
        tenantId: 'tenant-123',
      },
    };

    it('should list appointments for the authenticated patient', async () => {
      const query = {
        status: AppointmentStatus.SCHEDULED,
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockPatientService.listAppointments.mockResolvedValue(mockResponse);

      const result = await controller.listAppointments(query, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(mockPatientService.listAppointments).toHaveBeenCalledWith(
        'patient-123',
        'tenant-123',
        query,
      );
    });
  });

  describe('rescheduleAppointment', () => {
    const mockRequest = {
      user: {
        sub: 'patient-123',
        tenantId: 'tenant-123',
      },
    };

    it('should successfully reschedule an appointment', async () => {
      const appointmentId = 'appointment-123';
      const rescheduleDto = {
        newDate: '2025-05-20',
        newTimeSlot: '3:00 PM',
      };

      const mockAppointment = {
        id: appointmentId,
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: new Date('2025-05-20'),
        timeSlot: '3:00 PM',
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
        isRescheduled: true,
        tags: ['Rescheduled'],
        createdAt: new Date(),
        updatedAt: new Date(),
        patient: { id: 'patient-123', name: 'John Doe' },
        doctor: { id: 'doctor-123', name: 'Dr. Smith' },
      };

      mockPatientService.rescheduleAppointment.mockResolvedValue(mockAppointment);

      const result = await controller.rescheduleAppointment(
        appointmentId,
        rescheduleDto,
        mockRequest,
      );

      expect(result).toEqual(mockAppointment);
      expect(mockPatientService.rescheduleAppointment).toHaveBeenCalledWith(
        appointmentId,
        'patient-123',
        'tenant-123',
        '2025-05-20',
        '3:00 PM',
      );
    });

    it('should pass the correct appointment ID to the service', async () => {
      const appointmentId = 'test-appointment-456';
      const rescheduleDto = {
        newDate: '2025-05-25',
        newTimeSlot: '4:00 PM',
      };

      const mockAppointment = {
        id: appointmentId,
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: new Date('2025-05-25'),
        timeSlot: '4:00 PM',
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
        isRescheduled: true,
        tags: ['Rescheduled'],
        createdAt: new Date(),
        updatedAt: new Date(),
        patient: { id: 'patient-123', name: 'John Doe' },
        doctor: { id: 'doctor-123', name: 'Dr. Smith' },
      };

      mockPatientService.rescheduleAppointment.mockResolvedValue(mockAppointment);

      await controller.rescheduleAppointment(
        appointmentId,
        rescheduleDto,
        mockRequest,
      );

      expect(mockPatientService.rescheduleAppointment).toHaveBeenCalledWith(
        appointmentId,
        mockRequest.user.sub,
        mockRequest.user.tenantId,
        rescheduleDto.newDate,
        rescheduleDto.newTimeSlot,
      );
    });

    it('should extract patient ID from JWT token', async () => {
      const appointmentId = 'appointment-123';
      const rescheduleDto = {
        newDate: '2025-05-20',
        newTimeSlot: '3:00 PM',
      };
      const customRequest = {
        user: {
          sub: 'different-patient-789',
          tenantId: 'tenant-123',
        },
      };

      const mockAppointment = {
        id: appointmentId,
        patientId: 'different-patient-789',
        doctorId: 'doctor-123',
        date: new Date('2025-05-20'),
        timeSlot: '3:00 PM',
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
        isRescheduled: true,
        tags: ['Rescheduled'],
        createdAt: new Date(),
        updatedAt: new Date(),
        patient: { id: 'different-patient-789', name: 'Jane Doe' },
        doctor: { id: 'doctor-123', name: 'Dr. Smith' },
      };

      mockPatientService.rescheduleAppointment.mockResolvedValue(mockAppointment);

      await controller.rescheduleAppointment(
        appointmentId,
        rescheduleDto,
        customRequest,
      );

      expect(mockPatientService.rescheduleAppointment).toHaveBeenCalledWith(
        appointmentId,
        'different-patient-789',
        'tenant-123',
        '2025-05-20',
        '3:00 PM',
      );
    });

    it('should extract tenant ID from JWT token', async () => {
      const appointmentId = 'appointment-123';
      const rescheduleDto = {
        newDate: '2025-05-20',
        newTimeSlot: '3:00 PM',
      };
      const customRequest = {
        user: {
          sub: 'patient-123',
          tenantId: 'different-tenant-456',
        },
      };

      const mockAppointment = {
        id: appointmentId,
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: new Date('2025-05-20'),
        timeSlot: '3:00 PM',
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'different-tenant-456',
        isRescheduled: true,
        tags: ['Rescheduled'],
        createdAt: new Date(),
        updatedAt: new Date(),
        patient: { id: 'patient-123', name: 'John Doe' },
        doctor: { id: 'doctor-123', name: 'Dr. Smith' },
      };

      mockPatientService.rescheduleAppointment.mockResolvedValue(mockAppointment);

      await controller.rescheduleAppointment(
        appointmentId,
        rescheduleDto,
        customRequest,
      );

      expect(mockPatientService.rescheduleAppointment).toHaveBeenCalledWith(
        appointmentId,
        'patient-123',
        'different-tenant-456',
        '2025-05-20',
        '3:00 PM',
      );
    });

    it('should propagate service errors to the caller', async () => {
      const appointmentId = 'appointment-123';
      const rescheduleDto = {
        newDate: '2025-05-20',
        newTimeSlot: '3:00 PM',
      };
      const error = new Error('Cannot reschedule appointment within 30 minutes of scheduled time');
      mockPatientService.rescheduleAppointment.mockRejectedValue(error);

      await expect(
        controller.rescheduleAppointment(appointmentId, rescheduleDto, mockRequest),
      ).rejects.toThrow(error);
    });

    it('should return appointment with isRescheduled flag set to true', async () => {
      const appointmentId = 'appointment-123';
      const rescheduleDto = {
        newDate: '2025-05-20',
        newTimeSlot: '3:00 PM',
      };

      const mockAppointment = {
        id: appointmentId,
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: new Date('2025-05-20'),
        timeSlot: '3:00 PM',
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
        isRescheduled: true,
        tags: ['Rescheduled'],
        createdAt: new Date(),
        updatedAt: new Date(),
        patient: { id: 'patient-123', name: 'John Doe' },
        doctor: { id: 'doctor-123', name: 'Dr. Smith' },
      };

      mockPatientService.rescheduleAppointment.mockResolvedValue(mockAppointment);

      const result = await controller.rescheduleAppointment(
        appointmentId,
        rescheduleDto,
        mockRequest,
      );

      expect(result.isRescheduled).toBe(true);
    });

    it('should return appointment with "Rescheduled" tag', async () => {
      const appointmentId = 'appointment-123';
      const rescheduleDto = {
        newDate: '2025-05-20',
        newTimeSlot: '3:00 PM',
      };

      const mockAppointment = {
        id: appointmentId,
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: new Date('2025-05-20'),
        timeSlot: '3:00 PM',
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
        isRescheduled: true,
        tags: ['Rescheduled'],
        createdAt: new Date(),
        updatedAt: new Date(),
        patient: { id: 'patient-123', name: 'John Doe' },
        doctor: { id: 'doctor-123', name: 'Dr. Smith' },
      };

      mockPatientService.rescheduleAppointment.mockResolvedValue(mockAppointment);

      const result = await controller.rescheduleAppointment(
        appointmentId,
        rescheduleDto,
        mockRequest,
      );

      expect(result.tags).toContain('Rescheduled');
    });
  });
});
