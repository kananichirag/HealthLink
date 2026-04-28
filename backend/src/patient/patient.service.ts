import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, AppointmentStatus } from '@prisma/client';
import { BookAppointmentDto } from './dto';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Books a new appointment for a patient.
   * Validates doctor availability and checks for slot conflicts.
   * 
   * @param dto - Booking details (doctorId, date, timeSlot)
   * @param patientId - The ID of the patient booking the appointment
   * @param tenantId - The tenant ID for multi-tenancy
   * @returns Created appointment with patient and doctor details
   * @throws BadRequestException if slot is unavailable or doctor doesn't exist
   */
  async bookAppointment(
    dto: BookAppointmentDto,
    userId: string,
    tenantId: string,
  ) {
    this.logger.log(
      `Patient ${userId} attempting to book appointment with doctor ${dto.doctorId}`,
    );

    // Verify doctor exists
    const doctor = await this.prisma.user.findFirst({
      where: { id: dto.doctorId, role: 'DOCTOR' },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor not found');
    }

    // Use the doctor's tenantId for the appointment (patients don't have a tenantId)
    const appointmentTenantId = doctor.tenantId;
    if (!appointmentTenantId) {
      throw new BadRequestException('Doctor is not associated with a clinic');
    }

    // Look up the Patient record by matching the user's email
    // (Patient records are clinical records created by doctors, linked by email)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const patientRecord = await this.prisma.patient.findFirst({
      where: { email: user.email },
    });

    if (!patientRecord) {
      throw new BadRequestException(
        'No patient record found for your account. Please ask your doctor to register you as a patient first.',
      );
    }

    const patientId = patientRecord.id;

    // Check if the slot is available using helper method
    const appointmentDate = new Date(dto.date);
    const isAvailable = await this.checkSlotAvailability(
      dto.doctorId,
      appointmentDate,
      dto.timeSlot,
      appointmentTenantId,
    );

    if (!isAvailable) {
      throw new BadRequestException(
        'The selected time slot is no longer available',
      );
    }

    // Create the appointment using the doctor's tenantId
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId,
        doctorId: dto.doctorId,
        date: appointmentDate,
        timeSlot: dto.timeSlot,
        status: AppointmentStatus.SCHEDULED,
        tenantId: appointmentTenantId,
      },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Appointment ${appointment.id} created successfully`);
    return appointment;
  }

  /**
   * Validates if a patient can cancel an appointment based on the 30-minute rule.
   * Patients cannot cancel within 30 minutes of the appointment time.
   * 
   * @param appointmentId - The ID of the appointment to validate
   * @throws BadRequestException if less than 30 minutes remain
   * @returns true if cancellation is allowed
   */
  async validateCancellationWindow(appointmentId: string): Promise<boolean> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const minutesUntil = this.calculateTimeUntilAppointment(appointment);

    if (minutesUntil < 30) {
      throw new BadRequestException(
        'Cannot cancel appointment within 30 minutes of scheduled time',
      );
    }

    return true;
  }

  /**
   * Calculates the time remaining until an appointment in minutes.
   * 
   * @param appointment - The appointment object with date and timeSlot
   * @returns number of minutes until the appointment
   */
  private calculateTimeUntilAppointment(appointment: any): number {
    const appointmentDateTime = this.combineDateTime(
      appointment.date,
      appointment.timeSlot,
    );
    const now = new Date();
    const minutesUntil =
      (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);
    return minutesUntil;
  }

  /**
   * Combines a date and time slot string into a single Date object.
   * 
   * @param date - The appointment date
   * @param timeSlot - The time slot string (e.g., "2:00 PM")
   * @returns Combined Date object
   */
  private combineDateTime(date: Date, timeSlot: string): Date {
    const appointmentDate = new Date(date);
    const [time, period] = timeSlot.split(' ');
    const [hours, minutes] = time.split(':').map(Number);

    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }

    appointmentDate.setHours(hour24, minutes, 0, 0);
    return appointmentDate;
  }

  /**
   * Lists all appointments for a specific patient.
   * Returns all required fields including isRescheduled and tags.
   * Supports filtering by status, date range, and pagination.
   * 
   * @param patientId - The ID of the patient
   * @param tenantId - The tenant ID for multi-tenancy
   * @param filters - Optional filters for status, date range, pagination
   * @returns Paginated list of appointments with all required fields
   */
  async listAppointments(
    userId: string,
    tenantId: string,
    filters: {
      status?: AppointmentStatus;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { status, startDate, endDate, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Resolve the Patient record from the User's email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const patientRecord = await this.prisma.patient.findFirst({
      where: { email: user.email },
    });

    // If no patient record exists yet, return empty list (not an error)
    if (!patientRecord) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const patientId = patientRecord.id;
    const where: Prisma.AppointmentWhereInput = { patientId };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const [total, appointments] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
        select: {
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
          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    // Enrich appointments with computed tags and metadata
    const enrichedAppointments = await Promise.all(
      appointments.map(appointment => this.enrichAppointmentWithTags(appointment))
    );

    return { 
      data: enrichedAppointments, 
      total, 
      page, 
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Cancels an appointment for a patient with 30-minute rule validation.
   * 
   * @param appointmentId - The ID of the appointment to cancel
   * @param patientId - The ID of the patient requesting cancellation
   * @param tenantId - The tenant ID for multi-tenancy
   * @throws ForbiddenException if appointment doesn't belong to patient
   * @throws BadRequestException if within 30-minute window
   */
  async cancelAppointment(
    appointmentId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    this.logger.log(
      `Patient ${userId} attempting to cancel appointment ${appointmentId}`,
    );

    // Resolve Patient record from User email
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const patientRecord = user ? await this.prisma.patient.findFirst({ where: { email: user.email } }) : null;
    if (!patientRecord) {
      throw new ForbiddenException('Appointment not found or does not belong to you');
    }
    const patientId = patientRecord.id;

    // Verify the appointment belongs to this patient (tenantId not used — patients don't have one)
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, patientId },
    });

    if (!appointment) {
      throw new ForbiddenException(
        'Appointment not found or does not belong to you',
      );
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(
        'Only scheduled appointments can be cancelled',
      );
    }

    // Validate 30-minute cancellation window
    await this.validateCancellationWindow(appointmentId);

    // Update appointment status to CANCELLED
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED },
    });

    this.logger.log(`Appointment ${appointmentId} cancelled successfully`);
  }

  /**
   * Checks if a time slot is available for booking.
   * 
   * @param doctorId - The ID of the doctor
   * @param date - The appointment date
   * @param timeSlot - The time slot to check
   * @param tenantId - The tenant ID for multi-tenancy
   * @param excludeAppointmentId - Optional appointment ID to exclude from check (for rescheduling)
   * @returns true if slot is available, false otherwise
   */
  async checkSlotAvailability(
    doctorId: string,
    date: Date,
    timeSlot: string,
    tenantId: string,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const whereClause: any = {
      doctorId,
      date,
      timeSlot,
      status: AppointmentStatus.SCHEDULED,
    };

    // Only filter by tenantId if provided (patients don't have one, but doctor's tenantId is used)
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    if (excludeAppointmentId) {
      whereClause.id = { not: excludeAppointmentId };
    }

    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: whereClause,
    });

    return !conflictingAppointment;
  }

  /**
   * Adds the "Rescheduled" tag to an appointment if not already present.
   * 
   * @param appointmentId - The ID of the appointment
   * @returns Updated appointment with the tag
   */
  async addRescheduledTag(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { tags: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Only add tag if it doesn't already exist
    const tags = appointment.tags || [];
    if (!tags.includes('Rescheduled')) {
      return await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          tags: {
            push: 'Rescheduled',
          },
        },
      });
    }

    return appointment;
  }

  /**
   * Enriches an appointment object with computed tags and metadata.
   * This can be extended to add additional computed fields like overdue status.
   * 
   * @param appointment - The appointment object to enrich
   * @returns Enriched appointment with additional metadata
   */
  async enrichAppointmentWithTags(appointment: any): Promise<any> {
    const enriched = { ...appointment };

    // Ensure tags array exists
    const tags = appointment.tags || [];

    // Add computed fields based on appointment state
    if (appointment.isRescheduled && !tags.includes('Rescheduled')) {
      enriched.tags = [...tags, 'Rescheduled'];
    } else {
      enriched.tags = tags;
    }

    // Can be extended with additional computed fields
    // For example: overdue status, upcoming reminders, etc.

    return enriched;
  }

  /**
   * Reschedules an appointment to a new date and time.
   * Applies the same 30-minute rule as cancellation.
   * 
   * @param appointmentId - The ID of the appointment to reschedule
   * @param patientId - The ID of the patient requesting reschedule
   * @param tenantId - The tenant ID for multi-tenancy
   * @param newDate - The new appointment date
   * @param newTimeSlot - The new time slot
   * @returns Updated appointment object
   */
  async rescheduleAppointment(
    appointmentId: string,
    userId: string,
    tenantId: string,
    newDate: string,
    newTimeSlot: string,
  ) {
    this.logger.log(
      `Patient ${userId} attempting to reschedule appointment ${appointmentId}`,
    );

    // Resolve Patient record from User email
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const patientRecord = user ? await this.prisma.patient.findFirst({ where: { email: user.email } }) : null;
    if (!patientRecord) {
      throw new ForbiddenException('Appointment not found or does not belong to you');
    }
    const patientId = patientRecord.id;

    // Verify the appointment belongs to this patient (tenantId not used — patients don't have one)
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, patientId },
    });

    if (!appointment) {
      throw new ForbiddenException(
        'Appointment not found or does not belong to you',
      );
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(
        'Only scheduled appointments can be rescheduled',
      );
    }

    // Validate 30-minute cancellation window (same rule applies)
    const minutesUntil = this.calculateTimeUntilAppointment(appointment);
    if (minutesUntil < 30) {
      throw new BadRequestException(
        'Cannot reschedule appointment within 30 minutes of scheduled time',
      );
    }

    // Check if the new slot is available using helper method
    const newAppointmentDate = new Date(newDate);
    const isAvailable = await this.checkSlotAvailability(
      appointment.doctorId,
      newAppointmentDate,
      newTimeSlot,
      tenantId,
      appointmentId,
    );

    if (!isAvailable) {
      throw new BadRequestException(
        'The selected time slot is no longer available',
      );
    }

    // Update appointment with new date, time, and set rescheduled flag
    let updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        date: newAppointmentDate,
        timeSlot: newTimeSlot,
        isRescheduled: true,
      },
      include: {
        doctor: { select: { id: true, name: true } },
        patient: { select: { id: true, name: true } },
      },
    });

    // Add rescheduled tag using helper method
    const taggedAppointment = await this.addRescheduledTag(appointmentId);
    
    // Merge the tag update with the appointment data
    updatedAppointment = {
      ...updatedAppointment,
      tags: taggedAppointment.tags || updatedAppointment.tags,
    };

    this.logger.log(`Appointment ${appointmentId} rescheduled successfully`);
    return updatedAppointment;
  }
}
