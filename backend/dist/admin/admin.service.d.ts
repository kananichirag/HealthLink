import { PrismaService } from '../prisma/prisma.service';
import { TenantQueryDto, UserQueryDto } from './dto';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listTenants(query: TenantQueryDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    activateTenant(id: string): Promise<any>;
    deactivateTenant(id: string): Promise<any>;
    listUsers(query: UserQueryDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    activateUser(id: string): Promise<any>;
    deactivateUser(id: string): Promise<any>;
}
