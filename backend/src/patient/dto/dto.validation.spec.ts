import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BookAppointmentDto } from './book-appointment.dto';
import { RescheduleDto } from './reschedule.dto';
import { AppointmentQueryDto } from './appointment-query.dto';
import { AppointmentStatus } from '@prisma/client';

describe('Patient DTOs Validation', () => {
  describe('BookAppointmentDto', () => {
    it('should validate a valid booking request', async () => {
      const dto = plainToInstance(BookAppointmentDto, {
        doctorId: 'doctor-123',
        date: '2025-05-15',
        timeSlot: '2:00 PM',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail when doctorId is missing', async () => {
      const dto = plainToInstance(BookAppointmentDto, {
        date: '2025-05-15',
        timeSlot: '2:00 PM',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('doctorId');
    });

    it('should fail when date is invalid', async () => {
      const dto = plainToInstance(BookAppointmentDto, {
        doctorId: 'doctor-123',
        date: 'invalid-date',
        timeSlot: '2:00 PM',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('date');
    });

    it('should fail when timeSlot is missing', async () => {
      const dto = plainToInstance(BookAppointmentDto, {
        doctorId: 'doctor-123',
        date: '2025-05-15',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('timeSlot');
    });
  });

  describe('RescheduleDto', () => {
    it('should validate a valid reschedule request', async () => {
      const dto = plainToInstance(RescheduleDto, {
        newDate: '2025-05-20',
        newTimeSlot: '3:00 PM',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail when newDate is missing', async () => {
      const dto = plainToInstance(RescheduleDto, {
        newTimeSlot: '3:00 PM',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('newDate');
    });

    it('should fail when newTimeSlot is missing', async () => {
      const dto = plainToInstance(RescheduleDto, {
        newDate: '2025-05-20',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('newTimeSlot');
    });

    it('should fail when newDate is invalid', async () => {
      const dto = plainToInstance(RescheduleDto, {
        newDate: 'not-a-date',
        newTimeSlot: '3:00 PM',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('newDate');
    });
  });

  describe('AppointmentQueryDto', () => {
    it('should validate a valid query with all filters', async () => {
      const dto = plainToInstance(AppointmentQueryDto, {
        status: AppointmentStatus.SCHEDULED,
        startDate: '2025-05-01',
        endDate: '2025-05-31',
        page: 1,
        limit: 20,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate with default pagination values', async () => {
      const dto = plainToInstance(AppointmentQueryDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
    });

    it('should fail when status is invalid', async () => {
      const dto = plainToInstance(AppointmentQueryDto, {
        status: 'INVALID_STATUS',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
    });

    it('should fail when page is less than 1', async () => {
      const dto = plainToInstance(AppointmentQueryDto, {
        page: 0,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });

    it('should fail when limit exceeds 100', async () => {
      const dto = plainToInstance(AppointmentQueryDto, {
        limit: 150,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
    });

    it('should fail when startDate is invalid', async () => {
      const dto = plainToInstance(AppointmentQueryDto, {
        startDate: 'invalid-date',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('startDate');
    });

    it('should transform string numbers to integers for page and limit', async () => {
      const dto = plainToInstance(AppointmentQueryDto, {
        page: '2' as any,
        limit: '25' as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(typeof dto.page).toBe('number');
      expect(typeof dto.limit).toBe('number');
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(25);
    });
  });
});
