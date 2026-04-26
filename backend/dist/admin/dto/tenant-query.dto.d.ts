import { TenantType } from '@prisma/client';
export declare class TenantQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    type?: TenantType;
}
