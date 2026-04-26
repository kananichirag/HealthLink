import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

/**
 * Roles Guard
 *
 * Implements CanActivate to enforce role-based access control.
 * Reads role metadata from the route handler via Reflector.
 * Compares request.user.role against allowed roles.
 * Returns HTTP 403 if no match.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(Role.DOCTOR, Role.ADMIN)
 *   @Get('admin-only')
 *   getAdminResource() { ... }
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read roles metadata from the route handler
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow the request
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get the request object
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user is attached, deny access
    if (!user) {
      throw new ForbiddenException('Forbidden resource');
    }

    // Check if user's role matches any of the required roles
    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      throw new ForbiddenException('Forbidden resource');
    }

    return true;
  }
}
