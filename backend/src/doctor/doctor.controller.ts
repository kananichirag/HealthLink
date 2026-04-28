import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Query,
  Param,
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
import { DoctorService } from './doctor.service';
import {
  CreatePatientDto,
  PatientQueryDto,
  CreateAllergyReportDto,
  CreatePrescriptionDto,
  RequestConnectionDto,
  SetAvailabilityDto,
  BlockDateDto,
  SetMaxAppointmentsDto,
  AppointmentQueryDto,
  RescheduleDto,
} from './dto';

@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post('patients')
  @HttpCode(HttpStatus.CREATED)
  async createPatient(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CreatePatientDto,
    @Request() req: any,
  ) {
    return this.doctorService.createPatient(
      dto,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Get('patients')
  async listPatients(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: PatientQueryDto,
    @Request() req: any,
  ) {
    return this.doctorService.listPatients(query, req.user.tenantId);
  }

  @Post('allergy-reports')
  @HttpCode(HttpStatus.CREATED)
  async createAllergyReport(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CreateAllergyReportDto,
    @Request() req: any,
  ) {
    return this.doctorService.createAllergyReport(
      dto,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Get('allergy-reports/:patientId')
  async getPatientAllergyReports(
    @Param('patientId') patientId: string,
    @Request() req: any,
  ) {
    return this.doctorService.getPatientAllergyReports(
      patientId,
      req.user.tenantId,
    );
  }

  @Post('prescriptions')
  @HttpCode(HttpStatus.CREATED)
  async createPrescription(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CreatePrescriptionDto,
    @Request() req: any,
  ) {
    return this.doctorService.createPrescription(
      dto,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Post('prescriptions/:id/dispatch')
  @HttpCode(HttpStatus.OK)
  async dispatchToPharmacy(
    @Param('id') id: string,
    @Body('pharmacyId') pharmacyId: string,
    @Request() req: any,
  ) {
    return this.doctorService.dispatchToPharmacy(
      id,
      pharmacyId,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Post('pharmacy-connections')
  @HttpCode(HttpStatus.CREATED)
  async requestConnection(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: RequestConnectionDto,
    @Request() req: any,
  ) {
    return this.doctorService.requestConnection(
      dto,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Get('pharmacy-connections')
  async listConnections(@Request() req: any) {
    return this.doctorService.listConnections(req.user.sub);
  }

  @Get('pharmacies')
  async listPharmacies(@Request() req: any) {
    return this.doctorService.listPharmacies(req.user.sub);
  }

  @Delete('pharmacy-connections/:id')
  async terminateConnection(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.doctorService.terminateConnection(id, req.user.sub);
  }

  @Patch('pharmacy-connections/:id/accept')
  @Roles(Role.PHARMACY)
  async acceptConnection(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.doctorService.acceptConnection(id, req.user.sub);
  }

  @Get('appointments')
  async listAppointments(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: AppointmentQueryDto,
    @Request() req: any,
  ) {
    return this.doctorService.listAppointments(
      query,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Get('schedule')
  async getSchedule(@Request() req: any) {
    return this.doctorService.getSchedule(req.user.sub, req.user.tenantId);
  }

  @Put('schedule')
  async setAvailability(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: SetAvailabilityDto,
    @Request() req: any,
  ) {
    return this.doctorService.setAvailability(
      dto,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Post('schedule/block')
  @HttpCode(HttpStatus.CREATED)
  async blockDate(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: BlockDateDto,
    @Request() req: any,
  ) {
    return this.doctorService.blockDate(
      dto,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Delete('schedule/block/:date')
  async unblockDate(
    @Param('date') date: string,
    @Request() req: any,
  ) {
    return this.doctorService.unblockDate(
      date,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Put('schedule/max-appointments')
  async setMaxAppointments(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: SetMaxAppointmentsDto,
    @Request() req: any,
  ) {
    return this.doctorService.setMaxAppointments(
      dto,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Delete('appointments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelAppointment(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.doctorService.cancelAppointment(
      id,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Patch('appointments/:id/reschedule')
  @HttpCode(HttpStatus.OK)
  async rescheduleAppointment(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: RescheduleDto,
    @Request() req: any,
  ) {
    return this.doctorService.rescheduleAppointment(
      id,
      req.user.sub,
      req.user.tenantId,
      dto.newDate,
      dto.newTimeSlot,
    );
  }

  @Patch('appointments/:id/complete')
  @HttpCode(HttpStatus.OK)
  async completeAppointment(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.doctorService.completeAppointment(
      id,
      req.user.sub,
      req.user.tenantId,
    );
  }
}
