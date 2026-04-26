import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { TenantQueryDto, UserQueryDto } from './dto';

/**
 * AdminController
 *
 * Platform-wide administration endpoints. All routes are prefixed
 * with /admin and protected with JwtAuthGuard + RolesGuard (ADMIN role).
 * Admin bypasses tenant filtering (Prisma tenant middleware skips for ADMIN).
 *
 * Validates: Requirements 21.1, 21.2, 21.3, 21.4, 21.5
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('tenants')
  async listTenants(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: TenantQueryDto,
  ) {
    return this.adminService.listTenants(query);
  }

  @Patch('tenants/:id/activate')
  @HttpCode(HttpStatus.OK)
  async activateTenant(@Param('id') id: string) {
    return this.adminService.activateTenant(id);
  }

  @Patch('tenants/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateTenant(@Param('id') id: string) {
    return this.adminService.deactivateTenant(id);
  }

  @Get('users')
  async listUsers(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: UserQueryDto,
  ) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/activate')
  @HttpCode(HttpStatus.OK)
  async activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(id);
  }

  @Patch('users/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateUser(@Param('id') id: string) {
    return this.adminService.deactivateUser(id);
  }
}
