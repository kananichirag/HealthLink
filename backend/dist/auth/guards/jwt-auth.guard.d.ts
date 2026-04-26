import { ExecutionContext } from '@nestjs/common';
import { TenantService } from '../../tenant/tenant.service';
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    private readonly tenantService?;
    constructor(tenantService?: TenantService | undefined);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export {};
