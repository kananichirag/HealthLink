import { Controller, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

/**
 * TenantController
 *
 * Minimal controller for the Tenant module. Protected with JWT auth
 * and ADMIN role guard. Admin CRUD endpoints will be added in task 9.1.
 *
 * Validates: Requirements 1.4, 21.1, 21.3
 */
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}
}
