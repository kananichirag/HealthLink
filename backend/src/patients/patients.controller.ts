import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto, PatientResponseDto, PaginatedPatientsResponseDto } from './dto';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DOCTOR, Role.ADMIN)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPatient(
    @Body(ValidationPipe) createPatientDto: CreatePatientDto,
    @Request() req: any,
  ): Promise<PatientResponseDto> {
    return this.patientsService.createPatient(createPatientDto, req.user.sub);
  }

  @Get(':id')
  async getPatient(@Param('id') id: string): Promise<PatientResponseDto> {
    return this.patientsService.findPatientById(id);
  }

  @Put(':id')
  async updatePatient(
    @Param('id') id: string,
    @Body(ValidationPipe) updatePatientDto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientsService.updatePatient(id, updatePatientDto);
  }

  @Get()
  async getPatients(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<PaginatedPatientsResponseDto> {
    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    return this.patientsService.findAllPatients(page, limit, search);
  }
}