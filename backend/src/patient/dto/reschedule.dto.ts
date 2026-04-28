import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

/**
 * DTO for rescheduling an existing appointment.
 * Validates: Requirements 10.2
 */
export class RescheduleDto {
  @IsDateString({}, { message: 'Invalid date format' })
  @IsNotEmpty({ message: 'New date is required' })
  newDate: string;

  @IsString()
  @IsNotEmpty({ message: 'New time slot is required' })
  newTimeSlot: string;
}
