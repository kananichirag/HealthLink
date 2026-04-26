import { Role } from '@prisma/client';
export declare class UserQueryDto {
    page?: number;
    limit?: number;
    role?: Role;
    tenantId?: string;
    startDate?: string;
    endDate?: string;
}
