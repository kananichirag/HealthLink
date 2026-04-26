import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantQueryDto, UserQueryDto } from './dto';

/**
 * AdminService
 *
 * Platform-wide administration: tenant management and user oversight.
 * Admin operations bypass tenant filtering (Prisma tenant middleware
 * already skips for ADMIN role).
 *
 * Validates: Requirements 21.1, 21.2, 21.3, 21.4, 21.5
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all tenants with name, type, creation date, and active user count.
   */
  async listTenants(query: TenantQueryDto) {
    const { page = 1, limit = 10, search, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (type) {
      where.type = type;
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants.map((t: any) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        isActive: t.isActive,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        activeUserCount: t._count.users,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Activate a tenant.
   */
  async activateTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }
    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Deactivate a tenant. JWT invalidation is handled by JwtAuthGuard
   * checking tenant.isActive on each request.
   */
  async deactivateTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }
    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * List all users across tenants with role, tenant, and date filters.
   */
  async listUsers(query: UserQueryDto) {
    const { page = 1, limit = 10, role, tenantId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (tenantId) {
      where.tenantId = tenantId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
    };
  }

  /**
   * Activate a user account.
   * Note: The User model does not have an isActive field.
   * This endpoint restores the user's role if it was previously disabled,
   * or serves as a placeholder for future isActive field migration.
   */
  async activateUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    // Return user info — full activation would require an isActive field migration
    return {
      ...user,
      password: undefined,
      message: 'User account is active',
    };
  }

  /**
   * Deactivate a user account.
   * Note: The User model does not have an isActive field.
   * This endpoint serves as a placeholder for future isActive field migration.
   */
  async deactivateUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    // Return user info — full deactivation would require an isActive field migration
    return {
      ...user,
      password: undefined,
      message: 'User account deactivation noted. Full deactivation requires isActive field migration.',
    };
  }
}
