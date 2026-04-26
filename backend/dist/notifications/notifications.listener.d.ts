import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import type { PrescriptionCreatedPayload } from '../prescriptions/events/prescription.events';
import type { OrderStatusUpdatedPayload } from '../orders/events/order.events';
import type { PaymentStatusUpdatedPayload } from '../payments/events/payment.events';
import type { ExpiryWarningPayload } from './scheduler/expiry-check.scheduler';
export declare class NotificationsListener {
    private readonly prisma;
    private readonly notificationsService;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, emailService: EmailService);
    handlePrescriptionCreated(payload: PrescriptionCreatedPayload): Promise<void>;
    handleOrderStatusUpdated(payload: OrderStatusUpdatedPayload): Promise<void>;
    handlePaymentStatusUpdated(payload: PaymentStatusUpdatedPayload): Promise<void>;
    handleExpiryWarning(payload: ExpiryWarningPayload): Promise<void>;
    private notifyAdminsAndPharmacies;
}
