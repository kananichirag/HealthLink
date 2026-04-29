import { IsEnum, IsOptional } from 'class-validator';
import { ConnectionStatus } from '@prisma/client';

export class ConnectionQueryDto {
  @IsOptional()
  @IsEnum(ConnectionStatus)
  status?: ConnectionStatus;
}
