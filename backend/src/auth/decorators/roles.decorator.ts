import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Roles Decorator
 *
 * Attaches role requirements as metadata to a route handler.
 * Used in conjunction with RolesGuard to enforce role-based access control.
 *
 * Usage:
 *   @Roles(Role.DOCTOR, Role.ADMIN)
 *   @Get('admin-only')
 *   getAdminResource() { ... }
 *
 * Validates: Requirements 10.1, 10.2
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
