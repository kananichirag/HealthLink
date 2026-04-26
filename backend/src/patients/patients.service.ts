import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto, PatientResponseDto, PaginatedPatientsResponseDto } from './dto';
import { Patient, Prisma } from '@prisma/client';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(private prisma: PrismaService) {}

  async createPatient(createPatientDto: CreatePatientDto, createdBy: string): Promise<PatientResponseDto> {
    try {
      this.logger.log(`Creating patient: ${createPatientDto.name} by user: ${createdBy}`);
      
      // Verify the user exists before creating patient
      const user = await this.prisma.user.findUnique({
        where: { id: createdBy },
      });

      if (!user) {
        this.logger.error(`User with ID ${createdBy} not found`);
        throw new BadRequestException('User not found. Please log in again.');
      }

      // Sanitize text inputs
      const sanitizedData = {
        ...createPatientDto,
        name: this.sanitizeText(createPatientDto.name),
        medicalHistory: createPatientDto.medicalHistory ? this.sanitizeText(createPatientDto.medicalHistory) : undefined,
      };

      const patient = await this.prisma.patient.create({
        data: {
          ...sanitizedData,
          createdBy,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      return this.transformToResponseDto(patient);
    } catch (error) {
      this.logger.error(`Failed to create patient: ${error.message}`, error.stack);
      
      // Provide more specific error messages
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      if (error.code === 'P2003') {
        // Foreign key constraint error
        throw new BadRequestException('User not found. Please log in again.');
      }
      
      throw new BadRequestException('Failed to create patient');
    }
  }

  async findPatientById(id: string): Promise<PatientResponseDto> {
    try {
      const patient = await this.prisma.patient.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      if (!patient) {
        throw new NotFoundException(`Patient with ID ${id} not found`);
      }

      return this.transformToResponseDto(patient);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find patient by ID ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve patient');
    }
  }

  async updatePatient(id: string, updatePatientDto: UpdatePatientDto): Promise<PatientResponseDto> {
    try {
      this.logger.log(`Updating patient: ${id}`);

      // Check if patient exists
      const existingPatient = await this.prisma.patient.findUnique({
        where: { id },
      });

      if (!existingPatient) {
        throw new NotFoundException(`Patient with ID ${id} not found`);
      }

      // Sanitize text inputs
      const sanitizedData: Partial<UpdatePatientDto> = {};
      if (updatePatientDto.name) {
        sanitizedData.name = this.sanitizeText(updatePatientDto.name);
      }
      if (updatePatientDto.medicalHistory !== undefined) {
        sanitizedData.medicalHistory = updatePatientDto.medicalHistory ? this.sanitizeText(updatePatientDto.medicalHistory) : undefined;
      }
      if (updatePatientDto.age !== undefined) {
        sanitizedData.age = updatePatientDto.age;
      }
      if (updatePatientDto.gender !== undefined) {
        sanitizedData.gender = updatePatientDto.gender;
      }

      const patient = await this.prisma.patient.update({
        where: { id },
        data: sanitizedData,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      return this.transformToResponseDto(patient);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update patient ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update patient');
    }
  }

  async findAllPatients(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedPatientsResponseDto> {
    try {
      const skip = (page - 1) * limit;
      
      // Build search conditions
      const where: Prisma.PatientWhereInput = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { medicalHistory: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get total count and patients in parallel
      const [total, patients] = await Promise.all([
        this.prisma.patient.count({ where }),
        this.prisma.patient.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        }),
      ]);

      const transformedPatients = patients.map(patient => this.transformToResponseDto(patient));

      return {
        data: transformedPatients,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve patients: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve patients');
    }
  }

  private transformToResponseDto(patient: Patient & { creator?: any }): PatientResponseDto {
    const ageGroup = this.calculateAgeGroup(patient.age);
    const recordAge = this.calculateRecordAge(patient.createdAt);

    return {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      medicalHistory: patient.medicalHistory || undefined,
      createdBy: patient.createdBy,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      creator: patient.creator,
      ageGroup,
      recordAge,
    };
  }

  private calculateAgeGroup(age: number): 'CHILD' | 'ADULT' | 'SENIOR' {
    if (age < 18) return 'CHILD';
    if (age < 65) return 'ADULT';
    return 'SENIOR';
  }

  private calculateRecordAge(createdAt: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
  }

  private sanitizeText(text: string): string {
    // Basic sanitization to prevent injection attacks
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes that could be used for SQL injection
      .substring(0, 2000); // Ensure max length
  }
}