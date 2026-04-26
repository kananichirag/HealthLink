import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class BookAppointmentDto {
  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  timeSlot: string;
}
