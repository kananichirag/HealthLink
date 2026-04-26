import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto';
import { Tenant } from '@prisma/client';
export declare class TenantService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createTenant(dto: CreateTenantDto): Promise<Tenant>;
    findAll(): Promise<Tenant[]>;
    findById(id: string): Promise<Tenant>;
    activate(id: string): Promise<Tenant>;
    deactivate(id: string): Promise<Tenant>;
    getUserCount(id: string): Promise<number>;
}
