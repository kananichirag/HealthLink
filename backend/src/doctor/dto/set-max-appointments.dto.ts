import { IsInt, Min } from 'class-validator';

export class SetMaxAppointmentsDto {
  @IsInt()
  @Min(1)
  maxPerDay: number;
}
