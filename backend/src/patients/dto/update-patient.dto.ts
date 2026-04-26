import { IsString, IsInt, IsEnum, IsOptional, Min, Max, MaxLength } from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  medicalHistory?: string;
}