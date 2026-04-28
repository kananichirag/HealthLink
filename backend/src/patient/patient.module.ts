import { Module } from '@nestjs/common';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

/**
 * PatientModule handles patient-specific appointment operations.
 * 
 * This module provides:
 * - Appointment listing for patients
 * - Appointment cancellation with 30-minute rule enforcement
 * - Appointment rescheduling with validation
 * 
 * The module enforces patient-specific business rules, particularly
 * the 30-minute cancellation window that prevents patients from
 * canceling or rescheduling appointments within 30 minutes of the
 * scheduled time.
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
