import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PatientService } from './patient.service';
import { AppointmentQueryDto, RescheduleDto, BookAppointmentDto } from './dto';

/**
 * Controller for patient-specific appointment operations.
 * Handles appointment listing, cancellation, and rescheduling with patient-specific rules.
 */
@Controller('patient')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PATIENT)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  /**
   * Books a new appointment for the authenticated patient.
   * Validates doctor availability and checks for slot conflicts.
   * Creates appointment with SCHEDULED status.
   * 
   * @param body - Booking details (doctorId, date, timeSlot)
   * @param req - Request object containing authenticated user info
   * @returns Created appointment with patient and doctor details
   * @throws BadRequestException if slot is unavailable or doctor doesn't exist
   */
  @Post('appointments')
  async bookAppointment(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    body: BookAppointmentDto,
    @Request() req: any,
  ) {
    return this.patientService.bookAppointment(
      body,
      req.user.sub,
      req.user.tenantId,
    );
  }

  /**
   * Lists all appointments for the authenticated patient.
   * Supports filtering by status, date range, and pagination.
   * 
   * @param query - Query parameters for filtering and pagination
   * @param req - Request object containing authenticated user info
   * @returns Paginated list of appointments
   */
  @Get('appointments')
  async listAppointments(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: AppointmentQueryDto,
    @Request() req: any,
  ) {
    return this.patientService.listAppointments(
      req.user.sub,
      req.user.tenantId,
      query,
    );
  }

  /**
   * Cancels an appointment for the authenticated patient.
   * Enforces the 30-minute cancellation rule - patients cannot cancel
   * appointments within 30 minutes of the scheduled time.
   * 
   * @param id - The appointment ID to cancel
   * @param req - Request object containing authenticated user info
   * @throws BadRequestException if within 30-minute window
   * @throws ForbiddenException if appointment doesn't belong to patient
   */
  @Delete('appointments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelAppointment(@Param('id') id: string, @Request() req: any) {
    await this.patientService.cancelAppointment(
      id,
      req.user.sub,
      req.user.tenantId,
    );
  }

  /**
   * Reschedules an appointment to a new date and time.
   * Enforces the same 30-minute rule as cancellation.
   * Sets the isRescheduled flag and adds a "Rescheduled" tag.
   * 
   * @param id - The appointment ID to reschedule
   * @param body - New date and time slot
   * @param req - Request object containing authenticated user info
   * @returns Updated appointment object
   * @throws BadRequestException if within 30-minute window or slot unavailable
   * @throws ForbiddenException if appointment doesn't belong to patient
   */
  @Patch('appointments/:id/reschedule')
  async rescheduleAppointment(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    body: RescheduleDto,
    @Request() req: any,
  ) {
    return this.patientService.rescheduleAppointment(
      id,
      req.user.sub,
      req.user.tenantId,
      body.newDate,
      body.newTimeSlot,
    );
  }
}
