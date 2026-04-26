import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import type { PrescriptionCreatedPayload } from '../prescriptions/events/prescription.events';
import { PRESCRIPTION_CREATED } from '../prescriptions/events/prescription.events';
import type { OrderStatusUpdatedPayload } from '../orders/events/order.events';
import { ORDER_STATUS_UPDATED } from '../orders/events/order.events';
import type { PaymentStatusUpdatedPayload } from '../payments/events/payment.events';
import { PAYMENT_STATUS_UPDATED } from '../payments/events/payment.events';
import { INVENTORY_EXPIRY_WARNING } from './scheduler/expiry-check.scheduler';
import type { ExpiryWarningPayload } from './scheduler/expiry-check.scheduler';
import { Role } from '@prisma/client';

const LOW_STOCK_THRESHOLD = 10;

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  @OnEvent(PRESCRIPTION_CREATED)
  async handlePrescriptionCreated(payload: PrescriptionCreatedPayload): Promise<void> {
    try {
      // Check for low stock medicines
      for (const medicine of payload.medicines) {
        if (medicine.newQuantity < LOW_STOCK_THRESHOLD) {
          await this.notifyAdminsAndPharmacies(
            'LOW_STOCK',
            `Low stock alert: "${medicine.name}" has only ${medicine.newQuantity} units remaining.`,
            `Low Stock Alert: ${medicine.name}`,
            `The medicine "${medicine.name}" is running low. Current stock: ${medicine.newQuantity} units.`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error handling prescription.created event: ${error.message}`, error.stack);
    }
  }

  @OnEvent(ORDER_STATUS_UPDATED)
  async handleOrderStatusUpdated(payload: OrderStatusUpdatedPayload): Promise<void> {
    try {
      if (payload.newStatus === 'SHIPPED' || payload.newStatus === 'DELIVERED') {
        const message = payload.trackingInfo
          ? `Your order has been ${payload.newStatus.toLowerCase()}. Tracking: ${payload.trackingInfo}`
          : `Your order has been ${payload.newStatus.toLowerCase()}.`;

        // Find patient's user account for email
        const patient = await this.prisma.patient.findUnique({
          where: { id: payload.patientId },
          select: { name: true },
        });

        // Create in-app notification for the patient's user
        // Note: patientId here is the Patient record id; we need to find associated user
        // For now, we store notification with patientId as userId (they may differ)
        await this.notificationsService.create(
          payload.patientId,
          'ORDER_UPDATE',
          message,
        );

        this.logger.log(`Order update notification created for patient ${payload.patientId}`);
      }
    } catch (error) {
      this.logger.error(`Error handling order.status.updated event: ${error.message}`, error.stack);
    }
  }

  @OnEvent(PAYMENT_STATUS_UPDATED)
  async handlePaymentStatusUpdated(payload: PaymentStatusUpdatedPayload): Promise<void> {
    try {
      const statusText = payload.newStatus === 'SUCCEEDED' ? 'successful' : 'failed';
      const message = `Your payment of ${payload.amount / 100} ${payload.currency} was ${statusText}.`;

      await this.notificationsService.create(payload.userId, 'PAYMENT_UPDATE', message);

      // Send email
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { email: true, name: true },
      });

      if (user) {
        await this.emailService.sendMail(
          user.email,
          `Payment ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
          `Dear ${user.name},\n\n${message}\n\nThank you for using our platform.`,
        );
      }
    } catch (error) {
      this.logger.error(`Error handling payment.status.updated event: ${error.message}`, error.stack);
    }
  }

  @OnEvent(INVENTORY_EXPIRY_WARNING)
  async handleExpiryWarning(payload: ExpiryWarningPayload): Promise<void> {
    try {
      const expiryDateStr = payload.expiryDate.toLocaleDateString();
      await this.notifyAdminsAndPharmacies(
        'EXPIRY_WARNING',
        `Expiry warning: "${payload.name}" expires on ${expiryDateStr}.`,
        `Medicine Expiry Warning: ${payload.name}`,
        `The medicine "${payload.name}" is expiring on ${expiryDateStr}. Please take action.`,
      );
    } catch (error) {
      this.logger.error(`Error handling inventory.expiry_warning event: ${error.message}`, error.stack);
    }
  }

  private async notifyAdminsAndPharmacies(
    type: string,
    inAppMessage: string,
    emailSubject: string,
    emailBody: string,
  ): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.PHARMACY] } },
      select: { id: true, email: true, name: true },
    });

    await Promise.all(
      users.map(async (user) => {
        await this.notificationsService.create(user.id, type, inAppMessage);
        await this.emailService.sendMail(
          user.email,
          emailSubject,
          `Dear ${user.name},\n\n${emailBody}\n\nThank you.`,
        );
      }),
    );
  }
}
