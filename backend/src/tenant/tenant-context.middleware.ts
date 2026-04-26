import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantStorage } from './tenant-context';

/**
 * TenantContextMiddleware
 *
 * Reads tenantId and role from req.user (populated by JwtAuthGuard)
 * and stores them in AsyncLocalStorage for the duration of the request.
 * Downstream Prisma middleware reads from this context to inject tenant filters.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const user = (req as any).user;
    const tenantId = user?.tenantId ?? null;
    const role = user?.role ?? null;

    tenantStorage.run({ tenantId, role }, () => {
      next();
    });
  }
}
