import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

export const INVENTORY_EXPIRY_WARNING = 'inventory.expiry_warning';

export interface ExpiryWarningPayload {
  medicineId: string;
  name: string;
  expiryDate: Date;
}

@Injectable()
export class ExpiryCheckScheduler {
  private readonly logger = new Logger(ExpiryCheckScheduler.name);
  private readonly EXPIRY_WARNING_DAYS = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiringMedicines(): Promise<void> {
    this.logger.log('Running daily expiry check...');

    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + this.EXPIRY_WARNING_DAYS);

    try {
      const expiringMedicines = await this.prisma.medicine.findMany({
        where: {
          expiryDate: { gte: now, lte: warningDate },
        },
        select: { id: true, name: true, expiryDate: true },
      });

      for (const medicine of expiringMedicines) {
        const payload: ExpiryWarningPayload = {
          medicineId: medicine.id,
          name: medicine.name,
          expiryDate: medicine.expiryDate,
        };
        this.eventEmitter.emit(INVENTORY_EXPIRY_WARNING, payload);
      }

      this.logger.log(`Expiry check complete. Found ${expiringMedicines.length} expiring medicines.`);
    } catch (error) {
      this.logger.error(`Expiry check failed: ${error.message}`, error.stack);
    }
  }
}
