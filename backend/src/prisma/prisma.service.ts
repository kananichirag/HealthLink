import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createTenantExtension } from '../tenant/prisma-tenant.middleware';

/**
 * PrismaService with automatic tenant isolation via Prisma Client Extensions.
 *
 * All model operations (e.g., this.prisma.user.findMany()) are transparently
 * intercepted by the tenant extension, which injects tenantId from
 * AsyncLocalStorage context into queries for tenant-scoped models.
 *
 * Existing services continue to use `this.prisma.model.operation()` unchanged.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private _extendedClient: any;

  constructor() {
    super();
    this._extendedClient = (this as PrismaClient).$extends(createTenantExtension());
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Override model delegate accessors to return the extended (tenant-filtered) versions.
   * This ensures all existing code using `this.prisma.model.operation()` gets tenant isolation.
   */
  get user() { return this._extendedClient.user; }
  get patient() { return this._extendedClient.patient; }
  get medicine() { return this._extendedClient.medicine; }
  get prescription() { return this._extendedClient.prescription; }
  get prescriptionItem() { return this._extendedClient.prescriptionItem; }
  get sale() { return this._extendedClient.sale; }
  get saleItem() { return this._extendedClient.saleItem; }
  get order() { return this._extendedClient.order; }
  get payment() { return this._extendedClient.payment; }
  get notification() { return this._extendedClient.notification; }
  get tenant() { return this._extendedClient.tenant; }
  get doctorPharmacyConnection() { return this._extendedClient.doctorPharmacyConnection; }
  get allergyReport() { return this._extendedClient.allergyReport; }
  get appointment() { return this._extendedClient.appointment; }
  get doctorSchedule() { return this._extendedClient.doctorSchedule; }
  get blockedDate() { return this._extendedClient.blockedDate; }
  get purchaseRecord() { return this._extendedClient.purchaseRecord; }
}
