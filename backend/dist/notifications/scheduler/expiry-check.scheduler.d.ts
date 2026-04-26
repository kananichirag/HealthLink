import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
export declare const INVENTORY_EXPIRY_WARNING = "inventory.expiry_warning";
export interface ExpiryWarningPayload {
    medicineId: string;
    name: string;
    expiryDate: Date;
}
export declare class ExpiryCheckScheduler {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly logger;
    private readonly EXPIRY_WARNING_DAYS;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    checkExpiringMedicines(): Promise<void>;
}
