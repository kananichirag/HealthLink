import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto';
import { Tenant } from '@prisma/client';

/**
 * TenantService
 *
 * Manages tenant lifecycle: creation, lookup, activation/deactivation,
 * and user count queries. Primarily consumed internally by the auth
 * module during registration. Admin endpoints are added in task 9.1.
 *
 * Validates: Requirements 1.4, 21.1, 21.3
 */
@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async createTenant(dto: CreateTenantDto): Promise<Tenant> {
    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        type: dto.type,
      },
    });
  }

  async findAll(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }
    return tenant;
  }

  async activate(id: string): Promise<Tenant> {
    await this.findById(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(id: string): Promise<Tenant> {
    await this.findById(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getUserCount(id: string): Promise<number> {
    await this.findById(id);
    return this.prisma.user.count({
      where: { tenantId: id },
    });
  }
}
