import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsEnum,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { Role, TenantType } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  role: Role;

  /**
   * Optional: provide an existing tenantId to join an existing tenant.
   */
  @IsOptional()
  @IsString()
  tenantId?: string;

  /**
   * Required when role is DOCTOR or PHARMACY and tenantId is not provided.
   * Used to create a new tenant.
   */
  @ValidateIf((o) => !o.tenantId && (o.role === 'DOCTOR' || o.role === 'PHARMACY'))
  @IsString()
  @IsNotEmpty()
  tenantName?: string;

  /**
   * Required when role is DOCTOR or PHARMACY and tenantId is not provided.
   * Used to create a new tenant.
   */
  @ValidateIf((o) => !o.tenantId && (o.role === 'DOCTOR' || o.role === 'PHARMACY'))
  @IsEnum(TenantType)
  tenantType?: TenantType;
}
