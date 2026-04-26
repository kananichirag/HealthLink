import {
  Controller,
  Get,
  Post,
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
import { PatientPortalService } from './patient-portal.service';
import {
  BookAppointmentDto,
  PatientAppointmentQueryDto,
  PatientPrescriptionQueryDto,
} from './dto';

@Controller('patient')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PATIENT)
export class PatientPortalController {
  constructor(private readonly patientPortalService: PatientPortalService) {}

  @Get('doctors')
  async listDoctors() {
    return this.patientPortalService.listDoctors();
  }

  @Post('doctors/:id/connect')
  @HttpCode(HttpStatus.OK)
  async connectWithDoctor(
    @Param('id') doctorId: string,
    @Request() req: any,
  ) {
    return this.patientPortalService.connectWithDoctor(doctorId, req.user.sub);
  }

  @Get('doctors/:id/slots')
  async getAvailableSlots(
    @Param('id') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.patientPortalService.getAvailableSlots(doctorId, date);
  }

  @Post('appointments')
  @HttpCode(HttpStatus.CREATED)
  async bookAppointment(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: BookAppointmentDto,
    @Request() req: any,
  ) {
    return this.patientPortalService.bookAppointment(dto, req.user.sub);
  }

  @Patch('appointments/:id/cancel')
  async cancelAppointment(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.patientPortalService.cancelAppointment(id, req.user.sub);
  }

  @Get('appointments')
  async listAppointments(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: PatientAppointmentQueryDto,
    @Request() req: any,
  ) {
    return this.patientPortalService.listAppointments(query, req.user.sub);
  }

  @Get('prescriptions')
  async listPrescriptions(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: PatientPrescriptionQueryDto,
    @Request() req: any,
  ) {
    return this.patientPortalService.listPrescriptions(query, req.user.sub);
  }

  @Get('prescriptions/:id')
  async getPrescriptionDetail(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.patientPortalService.getPrescriptionDetail(id, req.user.sub);
  }
}
