import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RequestConnectionDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  pharmacyId: string;
}
