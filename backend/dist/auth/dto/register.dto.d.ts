import { Role, TenantType } from '@prisma/client';
export declare class RegisterDto {
    name: string;
    email: string;
    password: string;
    role: Role;
    tenantId?: string;
    tenantName?: string;
    tenantType?: TenantType;
}
