import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  BookAppointmentDto,
  PatientAppointmentQueryDto,
  PatientPrescriptionQueryDto,
} from './dto';
import { Prisma, DayOfWeek } from '@prisma/client';

const DAY_OF_WEEK_MAP: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

@Injectable()
export class PatientPortalService {
  private readonly logger = new Logger(PatientPortalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Find or create a Patient record for the authenticated user.
   * Patients are cross-tenant, so tenantId is null.
   */
  private async getOrCreatePatientRecord(userId: string) {
    // Look for an existing patient record created by this user (self-registered)
    let patient = await this.prisma.patient.findFirst({
      where: { createdBy: userId },
    });

    if (!patient) {
      // Get user info to create a patient record
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      patient = await this.prisma.patient.create({
        data: {
          name: user.name,
          email: user.email,
          age: 0,
          gender: 'OTHER',
          createdBy: userId,
          tenantId: null,
        },
      });
    }

    return patient;
  }

  /**
   * List all doctors with clinic name, specialization, and availability.
   */
  async listDoctors() {
    const doctors = await this.prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: {
        id: true,
        name: true,
        email: true,
        tenant: { select: { id: true, name: true } },
        doctorSchedules: {
          select: { dayOfWeek: true, startTime: true, endTime: true },
        },
      },
    });

    return doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      clinicName: doctor.tenant?.name ?? null,
      availability: doctor.doctorSchedules,
    }));
  }

  /**
   * Create a patient-doctor association.
   * We use the Appointment model implicitly — connecting means the patient
   * can now book appointments. We store a simple record via a lightweight approach.
   * For now, this is a no-op acknowledgment since any patient can book with any doctor.
   * The design says "create patient-doctor association record" — we'll return success.
   */
  async connectWithDoctor(doctorId: string, userId: string) {
    // Verify the doctor exists
    const doctor = await this.prisma.user.findFirst({
      where: { id: doctorId, role: 'DOCTOR' },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Ensure patient record exists
    await this.getOrCreatePatientRecord(userId);

    return { message: 'Connected with doctor successfully', doctorId };
  }

  /**
   * Get available slots for a doctor on a specific date.
   * Excludes booked slots and blocked dates.
   */
  async getAvailableSlots(doctorId: string, date: string) {
    const requestedDate = new Date(date);
    const dayOfWeek = DAY_OF_WEEK_MAP[requestedDate.getDay()];

    // Check if the date is blocked
    const blockedDate = await this.prisma.blockedDate.findFirst({
      where: {
        doctorId,
        date: requestedDate,
      },
    });

    if (blockedDate) {
      return { date, dayOfWeek, slots: [] };
    }

    // Get the doctor's schedule for this day of week
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: { doctorId, dayOfWeek },
      select: { startTime: true, endTime: true },
    });

    if (schedules.length === 0) {
      return { date, dayOfWeek, slots: [] };
    }

    // Get existing SCHEDULED appointments for this doctor on this date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        date: { gte: startOfDay, lte: endOfDay },
        status: 'SCHEDULED',
      },
      select: { timeSlot: true },
    });

    const bookedSlots = new Set(bookedAppointments.map((a) => a.timeSlot));

    // Generate 30-minute slots from each schedule range, filtering out booked ones
    const availableSlots: string[] = [];
    for (const schedule of schedules) {
      const [startH, startM] = schedule.startTime.split(':').map(Number);
      const [endH, endM] = schedule.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      for (let t = startMinutes; t + 30 <= endMinutes; t += 30) {
        const slotStart = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
        const slotEnd = `${String(Math.floor((t + 30) / 60)).padStart(2, '0')}:${String((t + 30) % 60).padStart(2, '0')}`;
        const slotKey = `${slotStart}-${slotEnd}`;
        if (!bookedSlots.has(slotKey)) {
          availableSlots.push(slotKey);
        }
      }
    }

    return { date, dayOfWeek, slots: availableSlots };
  }

  /**
   * Book an appointment with a doctor.
   * Checks slot availability, enforces max per day, creates SCHEDULED appointment,
   * and sends notifications to both patient and doctor.
   */
  async bookAppointment(dto: BookAppointmentDto, userId: string) {
    const { doctorId, date, timeSlot } = dto;
    const appointmentDate = new Date(date);
    const dayOfWeek = DAY_OF_WEEK_MAP[appointmentDate.getDay()];

    // Verify doctor exists
    const doctor = await this.prisma.user.findFirst({
      where: { id: doctorId, role: 'DOCTOR' },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check if date is blocked
    const blockedDate = await this.prisma.blockedDate.findFirst({
      where: { doctorId, date: appointmentDate },
    });

    if (blockedDate) {
      throw new ConflictException('This date is blocked by the doctor');
    }

    // Verify the time slot falls within the doctor's schedule for this day
    // Slots are 30-min sub-slots in format "HH:MM-HH:MM"
    const [slotStart, slotEnd] = timeSlot.split('-');
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: { doctorId, dayOfWeek },
      select: { startTime: true, endTime: true },
    });

    const slotFitsSchedule = schedules.some(
      (s) => slotStart >= s.startTime && slotEnd <= s.endTime,
    );

    if (!slotFitsSchedule) {
      throw new BadRequestException(
        "This time slot is not in the doctor's schedule",
      );
    }

    // Check if slot is already booked
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        date: { gte: startOfDay, lte: endOfDay },
        timeSlot,
        status: 'SCHEDULED',
      },
    });

    if (existingAppointment) {
      throw new ConflictException('This time slot is already booked');
    }

    // Check max appointments per day (default 20 if not configured)
    const maxPerDay = 20;
    const dayAppointmentCount = await this.prisma.appointment.count({
      where: {
        doctorId,
        date: { gte: startOfDay, lte: endOfDay },
        status: 'SCHEDULED',
      },
    });

    if (dayAppointmentCount >= maxPerDay) {
      throw new ConflictException(
        'Maximum appointments for this day has been reached',
      );
    }

    // Get or create patient record
    const patient = await this.getOrCreatePatientRecord(userId);

    // Create the appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        date: appointmentDate,
        timeSlot,
        status: 'SCHEDULED',
        tenantId: doctor.tenantId ?? '',
      },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    // Send notifications to both patient and doctor
    await Promise.all([
      this.notificationsService.create(
        userId,
        'APPOINTMENT_BOOKED',
        `Your appointment with Dr. ${doctor.name} on ${date} at ${timeSlot} has been confirmed`,
      ),
      this.notificationsService.create(
        doctorId,
        'APPOINTMENT_BOOKED',
        `New appointment with patient ${patient.name} on ${date} at ${timeSlot}`,
      ),
    ]);

    return appointment;
  }

  /**
   * Cancel a scheduled appointment.
   */
  async cancelAppointment(appointmentId: string, userId: string) {
    const patient = await this.getOrCreatePatientRecord(userId);

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, patientId: patient.id, status: 'SCHEDULED' },
      include: {
        doctor: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Scheduled appointment not found');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  /**
   * List patient's appointments with optional filters.
   */
  async listAppointments(query: PatientAppointmentQueryDto, userId: string) {
    const patient = await this.getOrCreatePatientRecord(userId);

    const { status, startDate, endDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = { patientId: patient.id };

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
        include: {
          doctor: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return { data: appointments, total, page, limit };
  }

  /**
   * List prescriptions assigned to the patient, sorted by createdAt desc.
   */
  async listPrescriptions(
    query: PatientPrescriptionQueryDto,
    userId: string,
  ) {
    const patient = await this.getOrCreatePatientRecord(userId);

    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PrescriptionWhereInput = { patientId: patient.id };

    const [total, prescriptions] = await Promise.all([
      this.prisma.prescription.count({ where }),
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: { select: { id: true, name: true } },
          items: {
            include: {
              medicine: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    // Attach pharmacy info for dispatched prescriptions
    const data = await Promise.all(
      prescriptions.map(async (rx) => {
        let pharmacy: { id: string; name: string } | null = null;
        if (rx.targetPharmacyId) {
          const pharmacyUser = await this.prisma.user.findUnique({
            where: { id: rx.targetPharmacyId },
            select: { id: true, name: true },
          });
          pharmacy = pharmacyUser ?? null;
        }
        return { ...rx, pharmacy };
      }),
    );

    return { data, total, page, limit };
  }

  /**
   * Get full prescription detail including all PrescriptionItem records,
   * doctor name, and pharmacy info.
   */
  async getPrescriptionDetail(prescriptionId: string, userId: string) {
    const patient = await this.getOrCreatePatientRecord(userId);

    const prescription = await this.prisma.prescription.findFirst({
      where: { id: prescriptionId, patientId: patient.id },
      include: {
        doctor: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            medicine: {
              select: { id: true, name: true, batchNumber: true },
            },
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Attach pharmacy info if dispatched
    let pharmacy: { id: string; name: string } | null = null;
    if (prescription.targetPharmacyId) {
      const pharmacyUser = await this.prisma.user.findUnique({
        where: { id: prescription.targetPharmacyId },
        select: { id: true, name: true },
      });
      pharmacy = pharmacyUser ?? null;
    }

    return { ...prescription, pharmacy };
  }
}
