import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Optional,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantService } from '../../tenant/tenant.service';

/**
 * JWT Authentication Guard
 *
 * Extends NestJS's built-in AuthGuard('jwt') to protect routes.
 * Returns HTTP 401 if token is missing or invalid.
 * Returns HTTP 403 if the user's tenant is deactivated.
 *
 * Validates: Requirements 9.3, 9.4, 9.5, 21.3
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    @Optional() @Inject(TenantService) private readonly tenantService?: TenantService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, run the standard JWT validation
    const isValid = await (super.canActivate(context) as Promise<boolean>);
    if (!isValid) {
      return false;
    }

    // After JWT validation, check tenant active status
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.tenantId && this.tenantService) {
      const tenant = await this.tenantService.findById(user.tenantId);
      if (!tenant.isActive) {
        throw new ForbiddenException('Your tenant has been deactivated');
      }
    }

    return true;
  }
}
