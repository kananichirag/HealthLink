import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

/**
 * DTO for booking a new appointment.
 * Validates: Requirements 10.1
 */
export class BookAppointmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Doctor ID is required' })
  doctorId: string;

  @IsDateString({}, { message: 'Invalid date format' })
  @IsNotEmpty({ message: 'Date is required' })
  date: string;

  @IsString()
  @IsNotEmpty({ message: 'Time slot is required' })
  timeSlot: string;
}
