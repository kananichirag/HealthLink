import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';

describe('PatientService', () => {
  let service: PatientService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    patient: {
      findFirst: jest.fn(),
    },
    appointment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('bookAppointment', () => {
    const bookingDto = {
      doctorId: 'doctor-123',
      date: '2025-05-15',
      timeSlot: '2:00 PM',
    };
    const patientId = 'patient-123';
    const tenantId = 'tenant-123';

    it('should successfully book an appointment when slot is available', async () => {
      const mockDoctor = {
        id: 'doctor-123',
        name: 'Dr. Smith',
        role: 'DOCTOR',
        tenantId: 'tenant-123',
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

      mockPrismaService.user.findFirst.mockResolvedValue(mockDoctor);
      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'patient@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: 'patient-123', email: 'patient@test.com' });
      mockPrismaService.appointment.findFirst.mockResolvedValue(null); // No conflict
      mockPrismaService.appointment.create.mockResolvedValue(mockAppointment);

      const result = await service.bookAppointment(bookingDto, patientId, tenantId);

      expect(result).toEqual(mockAppointment);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'doctor-123',
          role: 'DOCTOR',
        },
      });
      expect(mockPrismaService.appointment.findFirst).toHaveBeenCalledWith({
        where: {
          doctorId: 'doctor-123',
          date: new Date('2025-05-15'),
          timeSlot: '2:00 PM',
          status: AppointmentStatus.SCHEDULED,
          tenantId: 'tenant-123',
        },
      });
      expect(mockPrismaService.appointment.create).toHaveBeenCalledWith({
        data: {
          patientId: 'patient-123',
          doctorId: 'doctor-123',
          date: new Date('2025-05-15'),
          timeSlot: '2:00 PM',
          status: AppointmentStatus.SCHEDULED,
          tenantId: 'tenant-123',
        },
        include: {
          patient: { select: { id: true, name: true } },
          doctor: { select: { id: true, name: true } },
        },
      });
    });

    it('should throw BadRequestException when doctor does not exist', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.bookAppointment(bookingDto, patientId, tenantId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.bookAppointment(bookingDto, patientId, tenantId),
      ).rejects.toThrow('Doctor not found');
    });

    it('should throw BadRequestException when time slot is already booked', async () => {
      const mockDoctor = {
        id: 'doctor-123',
        name: 'Dr. Smith',
        role: 'DOCTOR',
        tenantId: 'tenant-123',
      };

      const conflictingAppointment = {
        id: 'existing-appointment',
        doctorId: 'doctor-123',
        date: new Date('2025-05-15'),
        timeSlot: '2:00 PM',
        status: AppointmentStatus.SCHEDULED,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockDoctor);
      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'patient@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: 'patient-123', email: 'patient@test.com' });
      mockPrismaService.appointment.findFirst.mockResolvedValue(conflictingAppointment);

      await expect(
        service.bookAppointment(bookingDto, patientId, tenantId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.bookAppointment(bookingDto, patientId, tenantId),
      ).rejects.toThrow('The selected time slot is no longer available');
    });
  });

  describe('validateCancellationWindow', () => {
    it('should return true when more than 30 minutes remain before appointment', async () => {
      // Create appointment 2 hours in the future
      const now = new Date();
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
      const hours = futureTime.getHours();
      const minutes = futureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: 'appointment-123',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: futureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await service.validateCancellationWindow('appointment-123');

      expect(result).toBe(true);
      expect(mockPrismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
      });
    });

    it('should throw BadRequestException when less than 30 minutes remain', async () => {
      // Create appointment 20 minutes in the future
      const now = new Date();
      const nearFutureTime = new Date(now.getTime() + 20 * 60 * 1000); // 20 minutes from now
      const hours = nearFutureTime.getHours();
      const minutes = nearFutureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: 'appointment-123',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: nearFutureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      await expect(
        service.validateCancellationWindow('appointment-123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateCancellationWindow('appointment-123'),
      ).rejects.toThrow('Cannot cancel appointment within 30 minutes of scheduled time');
    });

    it('should throw BadRequestException when exactly 29 minutes remain', async () => {
      // Create appointment exactly 29 minutes in the future
      const now = new Date();
      const nearFutureTime = new Date(now.getTime() + 29 * 60 * 1000); // 29 minutes from now
      const hours = nearFutureTime.getHours();
      const minutes = nearFutureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: 'appointment-123',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: nearFutureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      await expect(
        service.validateCancellationWindow('appointment-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return true when exactly 30 minutes remain', async () => {
      // Create appointment 31 minutes in the future to ensure it's safely above 30 minutes
      const now = new Date();
      const futureTime = new Date(now.getTime() + 31 * 60 * 1000); // 31 minutes from now
      const hours = futureTime.getHours();
      const minutes = futureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: 'appointment-123',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: futureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await service.validateCancellationWindow('appointment-123');

      expect(result).toBe(true);
    });

    it('should throw NotFoundException when appointment does not exist', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(
        service.validateCancellationWindow('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.validateCancellationWindow('non-existent-id'),
      ).rejects.toThrow('Appointment not found');
    });

    it('should handle appointments with AM time slots correctly', async () => {
      // Create appointment for tomorrow at 9:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const mockAppointment = {
        id: 'appointment-123',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: tomorrow,
        timeSlot: '9:00 AM',
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await service.validateCancellationWindow('appointment-123');

      expect(result).toBe(true);
    });

    it('should handle appointments with PM time slots correctly', async () => {
      // Create appointment for tomorrow at 2:30 PM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 30, 0, 0);

      const mockAppointment = {
        id: 'appointment-123',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: tomorrow,
        timeSlot: '2:30 PM',
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await service.validateCancellationWindow('appointment-123');

      expect(result).toBe(true);
    });

    it('should handle noon (12:00 PM) time slot correctly', async () => {
      // Create appointment for tomorrow at noon
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);

      const mockAppointment = {
        id: 'appointment-123',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: tomorrow,
        timeSlot: '12:00 PM',
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await service.validateCancellationWindow('appointment-123');

      expect(result).toBe(true);
    });

    it('should handle midnight (12:00 AM) time slot correctly', async () => {
      // Create appointment for 2 days from now at midnight to ensure it's well beyond 30 minutes
      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + 2);
      futureDate.setHours(0, 0, 0, 0);

      const mockAppointment = {
        id: 'appointment-123',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: futureDate,
        timeSlot: '12:00 AM',
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await service.validateCancellationWindow('appointment-123');

      expect(result).toBe(true);
    });

    it('should throw BadRequestException for appointments in the past', async () => {
      // Create appointment 1 hour in the past
      const now = new Date();
      const pastTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      const hours = pastTime.getHours();
      const minutes = pastTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: 'appointment-123',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: pastTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      await expect(
        service.validateCancellationWindow('appointment-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle appointments with single-digit minutes correctly', async () => {
      // Create appointment well beyond 30 minutes in the future with single-digit minutes
      const now = new Date();
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
      futureTime.setMinutes(5); // Set to 5 minutes past the hour
      const hours = futureTime.getHours();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:05 ${period}`;

      const mockAppointment = {
        id: 'appointment-123',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: futureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await service.validateCancellationWindow('appointment-123');

      expect(result).toBe(true);
    });

    it('should correctly calculate time for appointments crossing day boundary', async () => {
      // Create appointment for next day at 1:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(1, 0, 0, 0);

      const mockAppointment = {
        id: 'appointment-123',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        date: tomorrow,
        timeSlot: '1:00 AM',
        status: AppointmentStatus.SCHEDULED,
        tenantId: 'tenant-123',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await service.validateCancellationWindow('appointment-123');

      expect(result).toBe(true);
    });
  });

  describe('cancelAppointment', () => {
    const appointmentId = 'appointment-123';
    const patientId = 'patient-123';
    const tenantId = 'tenant-123';

    it('should successfully cancel an appointment when more than 30 minutes remain', async () => {
      // Create appointment 2 hours in the future
      const now = new Date();
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const hours = futureTime.getHours();
      const minutes = futureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: appointmentId,
        patientId: patientId,
        doctorId: 'doctor-123',
        date: futureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: tenantId,
      };

      mockPrismaService.appointment.findFirst.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'patient@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: patientId, email: 'patient@test.com' });
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      });

      await service.cancelAppointment(appointmentId, patientId, tenantId);

      expect(mockPrismaService.appointment.findFirst).toHaveBeenCalledWith({
        where: { id: appointmentId, patientId: patientId },
      });
      expect(mockPrismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: appointmentId },
      });
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.CANCELLED },
      });
    });

    it('should throw ForbiddenException when appointment does not belong to patient', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'patient@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: patientId, email: 'patient@test.com' });
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);

      await expect(
        service.cancelAppointment(appointmentId, patientId, tenantId),
      ).rejects.toThrow('Appointment not found or does not belong to you');
    });

    it('should throw BadRequestException when appointment is not SCHEDULED', async () => {
      const mockAppointment = {
        id: appointmentId,
        patientId: patientId,
        doctorId: 'doctor-123',
        date: new Date(),
        timeSlot: '2:00 PM',
        status: AppointmentStatus.COMPLETED,
        tenantId: tenantId,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'patient@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: patientId, email: 'patient@test.com' });
      mockPrismaService.appointment.findFirst.mockResolvedValue(mockAppointment);

      await expect(
        service.cancelAppointment(appointmentId, patientId, tenantId),
      ).rejects.toThrow('Only scheduled appointments can be cancelled');
    });

    it('should throw BadRequestException when less than 30 minutes remain', async () => {
      // Create appointment 20 minutes in the future
      const now = new Date();
      const nearFutureTime = new Date(now.getTime() + 20 * 60 * 1000);
      const hours = nearFutureTime.getHours();
      const minutes = nearFutureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: appointmentId,
        patientId: patientId,
        doctorId: 'doctor-123',
        date: nearFutureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: tenantId,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'patient@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: patientId, email: 'patient@test.com' });
      mockPrismaService.appointment.findFirst.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      await expect(
        service.cancelAppointment(appointmentId, patientId, tenantId),
      ).rejects.toThrow('Cannot cancel appointment within 30 minutes of scheduled time');
    });

    it('should throw BadRequestException when appointment is already CANCELLED', async () => {
      const mockAppointment = {
        id: appointmentId,
        patientId: patientId,
        doctorId: 'doctor-123',
        date: new Date(),
        timeSlot: '2:00 PM',
        status: AppointmentStatus.CANCELLED,
        tenantId: tenantId,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'patient@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: patientId, email: 'patient@test.com' });
      mockPrismaService.appointment.findFirst.mockResolvedValue(mockAppointment);

      await expect(
        service.cancelAppointment(appointmentId, patientId, tenantId),
      ).rejects.toThrow('Only scheduled appointments can be cancelled');
    });

    it('should verify appointment ownership before cancellation', async () => {
      const wrongPatientId = 'wrong-patient-123';
      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'wrong@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: wrongPatientId, email: 'wrong@test.com' });
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);

      await expect(
        service.cancelAppointment(appointmentId, wrongPatientId, tenantId),
      ).rejects.toThrow('Appointment not found or does not belong to you');

      expect(mockPrismaService.appointment.findFirst).toHaveBeenCalledWith({
        where: { id: appointmentId, patientId: wrongPatientId },
      });
    });
  });

  describe('rescheduleAppointment', () => {
    const appointmentId = 'appointment-123';
    const patientId = 'patient-123';
    const tenantId = 'tenant-123';
    const newDate = '2025-05-20';
    const newTimeSlot = '3:00 PM';

    beforeEach(() => {
      // All reschedule tests need user/patient resolution
      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'patient@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: patientId, email: 'patient@test.com' });
    });

    it('should successfully reschedule an appointment when more than 30 minutes remain', async () => {
      // Create appointment 2 hours in the future
      const now = new Date();
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const hours = futureTime.getHours();
      const minutes = futureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: appointmentId,
        patientId: patientId,
        doctorId: 'doctor-123',
        date: futureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: tenantId,
        isRescheduled: false,
        tags: [],
      };

      const updatedAppointment = {
        ...mockAppointment,
        date: new Date(newDate),
        timeSlot: newTimeSlot,
        isRescheduled: true,
        tags: [],
        patient: { id: patientId, name: 'John Doe' },
        doctor: { id: 'doctor-123', name: 'Dr. Smith' },
      };

      const taggedAppointment = {
        ...updatedAppointment,
        tags: ['Rescheduled'],
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'patient@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: patientId, email: 'patient@test.com' });
      mockPrismaService.appointment.findFirst
        .mockResolvedValueOnce(mockAppointment) // First call for ownership check
        .mockResolvedValueOnce(null); // Second call for slot availability check
      mockPrismaService.appointment.update
        .mockResolvedValueOnce(updatedAppointment) // First update for date/time
        .mockResolvedValueOnce(taggedAppointment); // Second update for tags
      mockPrismaService.appointment.findUnique.mockResolvedValue({ tags: [] }); // For addRescheduledTag

      const result = await service.rescheduleAppointment(
        appointmentId,
        patientId,
        tenantId,
        newDate,
        newTimeSlot,
      );

      expect(result).toEqual(taggedAppointment);
      expect(result.isRescheduled).toBe(true);
      expect(result.tags).toContain('Rescheduled');
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: {
          date: new Date(newDate),
          timeSlot: newTimeSlot,
          isRescheduled: true,
        },
        include: {
          doctor: { select: { id: true, name: true } },
          patient: { select: { id: true, name: true } },
        },
      });
    });

    it('should throw ForbiddenException when appointment does not belong to patient', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'patient@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: patientId, email: 'patient@test.com' });
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);

      await expect(
        service.rescheduleAppointment(appointmentId, patientId, tenantId, newDate, newTimeSlot),
      ).rejects.toThrow('Appointment not found or does not belong to you');
    });

    it('should throw BadRequestException when appointment is not SCHEDULED', async () => {
      const mockAppointment = {
        id: appointmentId,
        patientId: patientId,
        doctorId: 'doctor-123',
        date: new Date(),
        timeSlot: '2:00 PM',
        status: AppointmentStatus.COMPLETED,
        tenantId: tenantId,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'patient@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: patientId, email: 'patient@test.com' });
      mockPrismaService.appointment.findFirst.mockResolvedValue(mockAppointment);

      await expect(
        service.rescheduleAppointment(appointmentId, patientId, tenantId, newDate, newTimeSlot),
      ).rejects.toThrow('Only scheduled appointments can be rescheduled');
    });

    it('should throw BadRequestException when less than 30 minutes remain', async () => {
      // Create appointment 20 minutes in the future
      const now = new Date();
      const nearFutureTime = new Date(now.getTime() + 20 * 60 * 1000);
      const hours = nearFutureTime.getHours();
      const minutes = nearFutureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: appointmentId,
        patientId: patientId,
        doctorId: 'doctor-123',
        date: nearFutureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: tenantId,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'patient@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: patientId, email: 'patient@test.com' });
      mockPrismaService.appointment.findFirst.mockResolvedValue(mockAppointment);

      await expect(
        service.rescheduleAppointment(appointmentId, patientId, tenantId, newDate, newTimeSlot),
      ).rejects.toThrow('Cannot reschedule appointment within 30 minutes of scheduled time');
    });

    it('should throw BadRequestException when new time slot is unavailable', async () => {
      // Create appointment 2 hours in the future
      const now = new Date();
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const hours = futureTime.getHours();
      const minutes = futureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: appointmentId,
        patientId: patientId,
        doctorId: 'doctor-123',
        date: futureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: tenantId,
      };

      const conflictingAppointment = {
        id: 'other-appointment',
        doctorId: 'doctor-123',
        date: new Date(newDate),
        timeSlot: newTimeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: tenantId,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'patient@test.com' });
      mockPrismaService.patient.findFirst.mockResolvedValue({ id: patientId, email: 'patient@test.com' });
      mockPrismaService.appointment.findFirst
        .mockResolvedValueOnce(mockAppointment) // First call for ownership check
        .mockResolvedValueOnce(conflictingAppointment); // Second call for slot availability check

      await expect(
        service.rescheduleAppointment(appointmentId, patientId, tenantId, newDate, newTimeSlot),
      ).rejects.toThrow('The selected time slot is no longer available');
    });

    it('should check slot availability excluding the current appointment', async () => {
      // Create appointment 2 hours in the future
      const now = new Date();
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const hours = futureTime.getHours();
      const minutes = futureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: appointmentId,
        patientId: patientId,
        doctorId: 'doctor-123',
        date: futureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: tenantId,
        isRescheduled: false,
        tags: [],
      };

      mockPrismaService.appointment.findFirst
        .mockResolvedValueOnce(mockAppointment) // First call for ownership check
        .mockResolvedValueOnce(null); // Second call for slot availability check
      mockPrismaService.appointment.update
        .mockResolvedValueOnce({
          ...mockAppointment,
          date: new Date(newDate),
          timeSlot: newTimeSlot,
          isRescheduled: true,
          tags: [],
          patient: { id: patientId, name: 'John Doe' },
          doctor: { id: 'doctor-123', name: 'Dr. Smith' },
        })
        .mockResolvedValueOnce({
          ...mockAppointment,
          date: new Date(newDate),
          timeSlot: newTimeSlot,
          isRescheduled: true,
          tags: ['Rescheduled'],
          patient: { id: patientId, name: 'John Doe' },
          doctor: { id: 'doctor-123', name: 'Dr. Smith' },
        });
      mockPrismaService.appointment.findUnique.mockResolvedValue({ tags: [] });

      await service.rescheduleAppointment(
        appointmentId,
        patientId,
        tenantId,
        newDate,
        newTimeSlot,
      );

      // Verify the second findFirst call excludes the current appointment
      expect(mockPrismaService.appointment.findFirst).toHaveBeenNthCalledWith(2, {
        where: {
          doctorId: 'doctor-123',
          date: new Date(newDate),
          timeSlot: newTimeSlot,
          status: AppointmentStatus.SCHEDULED,
          tenantId: tenantId,
          id: { not: appointmentId },
        },
      });
    });

    it('should set isRescheduled flag to true', async () => {
      // Create appointment 2 hours in the future
      const now = new Date();
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const hours = futureTime.getHours();
      const minutes = futureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: appointmentId,
        patientId: patientId,
        doctorId: 'doctor-123',
        date: futureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: tenantId,
        isRescheduled: false,
        tags: [],
      };

      const updatedAppointment = {
        ...mockAppointment,
        date: new Date(newDate),
        timeSlot: newTimeSlot,
        isRescheduled: true,
        tags: ['Rescheduled'],
        patient: { id: patientId, name: 'John Doe' },
        doctor: { id: 'doctor-123', name: 'Dr. Smith' },
      };

      mockPrismaService.appointment.findFirst
        .mockResolvedValueOnce(mockAppointment)
        .mockResolvedValueOnce(null);
      mockPrismaService.appointment.update
        .mockResolvedValueOnce(updatedAppointment)
        .mockResolvedValueOnce(updatedAppointment);
      mockPrismaService.appointment.findUnique.mockResolvedValue({ tags: [] });

      const result = await service.rescheduleAppointment(
        appointmentId,
        patientId,
        tenantId,
        newDate,
        newTimeSlot,
      );

      expect(result.isRescheduled).toBe(true);
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isRescheduled: true,
          }),
        }),
      );
    });

    it('should add "Rescheduled" to tags array', async () => {
      // Create appointment 2 hours in the future
      const now = new Date();
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const hours = futureTime.getHours();
      const minutes = futureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: appointmentId,
        patientId: patientId,
        doctorId: 'doctor-123',
        date: futureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: tenantId,
        isRescheduled: false,
        tags: [],
      };

      const updatedAppointment = {
        ...mockAppointment,
        date: new Date(newDate),
        timeSlot: newTimeSlot,
        isRescheduled: true,
        tags: ['Rescheduled'],
        patient: { id: patientId, name: 'John Doe' },
        doctor: { id: 'doctor-123', name: 'Dr. Smith' },
      };

      mockPrismaService.appointment.findFirst
        .mockResolvedValueOnce(mockAppointment)
        .mockResolvedValueOnce(null);
      mockPrismaService.appointment.update
        .mockResolvedValueOnce(updatedAppointment)
        .mockResolvedValueOnce(updatedAppointment);
      mockPrismaService.appointment.findUnique.mockResolvedValue({ tags: [] });

      const result = await service.rescheduleAppointment(
        appointmentId,
        patientId,
        tenantId,
        newDate,
        newTimeSlot,
      );

      expect(result.tags).toContain('Rescheduled');
      expect(mockPrismaService.appointment.update).toHaveBeenCalled();
    });

    it('should update appointment date and timeSlot', async () => {
      // Create appointment 2 hours in the future
      const now = new Date();
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const hours = futureTime.getHours();
      const minutes = futureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: appointmentId,
        patientId: patientId,
        doctorId: 'doctor-123',
        date: futureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: tenantId,
        isRescheduled: false,
        tags: [],
      };

      const updatedAppointment = {
        ...mockAppointment,
        date: new Date(newDate),
        timeSlot: newTimeSlot,
        isRescheduled: true,
        tags: ['Rescheduled'],
        patient: { id: patientId, name: 'John Doe' },
        doctor: { id: 'doctor-123', name: 'Dr. Smith' },
      };

      mockPrismaService.appointment.findFirst
        .mockResolvedValueOnce(mockAppointment)
        .mockResolvedValueOnce(null);
      mockPrismaService.appointment.update
        .mockResolvedValueOnce(updatedAppointment)
        .mockResolvedValueOnce(updatedAppointment);
      mockPrismaService.appointment.findUnique.mockResolvedValue({ tags: [] });

      const result = await service.rescheduleAppointment(
        appointmentId,
        patientId,
        tenantId,
        newDate,
        newTimeSlot,
      );

      expect(result.date).toEqual(new Date(newDate));
      expect(result.timeSlot).toBe(newTimeSlot);
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: new Date(newDate),
            timeSlot: newTimeSlot,
          }),
        }),
      );
    });

    it('should return updated appointment with patient and doctor details', async () => {
      // Create appointment 2 hours in the future
      const now = new Date();
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const hours = futureTime.getHours();
      const minutes = futureTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeSlot = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      const mockAppointment = {
        id: appointmentId,
        patientId: patientId,
        doctorId: 'doctor-123',
        date: futureTime,
        timeSlot: timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: tenantId,
        isRescheduled: false,
        tags: [],
      };

      const updatedAppointment = {
        ...mockAppointment,
        date: new Date(newDate),
        timeSlot: newTimeSlot,
        isRescheduled: true,
        tags: ['Rescheduled'],
        patient: { id: patientId, name: 'John Doe' },
        doctor: { id: 'doctor-123', name: 'Dr. Smith' },
      };

      mockPrismaService.appointment.findFirst
        .mockResolvedValueOnce(mockAppointment)
        .mockResolvedValueOnce(null);
      mockPrismaService.appointment.update
        .mockResolvedValueOnce(updatedAppointment)
        .mockResolvedValueOnce(updatedAppointment);
      mockPrismaService.appointment.findUnique.mockResolvedValue({ tags: [] });

      const result = await service.rescheduleAppointment(
        appointmentId,
        patientId,
        tenantId,
        newDate,
        newTimeSlot,
      );

      expect(result.patient).toBeDefined();
      expect(result.patient.id).toBe(patientId);
      expect(result.patient.name).toBe('John Doe');
      expect(result.doctor).toBeDefined();
      expect(result.doctor.id).toBe('doctor-123');
      expect(result.doctor.name).toBe('Dr. Smith');
    });
  });
});