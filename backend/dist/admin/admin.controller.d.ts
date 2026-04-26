import { AdminService } from './admin.service';
import { TenantQueryDto, UserQueryDto } from './dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
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
