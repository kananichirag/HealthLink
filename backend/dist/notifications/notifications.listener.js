"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("./notifications.service");
const email_service_1 = require("./email.service");
const prescription_events_1 = require("../prescriptions/events/prescription.events");
const order_events_1 = require("../orders/events/order.events");
const payment_events_1 = require("../payments/events/payment.events");
const expiry_check_scheduler_1 = require("./scheduler/expiry-check.scheduler");
const client_1 = require("@prisma/client");
const LOW_STOCK_THRESHOLD = 10;
let NotificationsListener = NotificationsListener_1 = class NotificationsListener {
    prisma;
    notificationsService;
    emailService;
    logger = new common_1.Logger(NotificationsListener_1.name);
    constructor(prisma, notificationsService, emailService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.emailService = emailService;
    }
    async handlePrescriptionCreated(payload) {
        try {
            for (const medicine of payload.medicines) {
                if (medicine.newQuantity < LOW_STOCK_THRESHOLD) {
                    await this.notifyAdminsAndPharmacies('LOW_STOCK', `Low stock alert: "${medicine.name}" has only ${medicine.newQuantity} units remaining.`, `Low Stock Alert: ${medicine.name}`, `The medicine "${medicine.name}" is running low. Current stock: ${medicine.newQuantity} units.`);
                }
            }
        }
        catch (error) {
            this.logger.error(`Error handling prescription.created event: ${error.message}`, error.stack);
        }
    }
    async handleOrderStatusUpdated(payload) {
        try {
            if (payload.newStatus === 'SHIPPED' || payload.newStatus === 'DELIVERED') {
                const message = payload.trackingInfo
                    ? `Your order has been ${payload.newStatus.toLowerCase()}. Tracking: ${payload.trackingInfo}`
                    : `Your order has been ${payload.newStatus.toLowerCase()}.`;
                const patient = await this.prisma.patient.findUnique({
                    where: { id: payload.patientId },
                    select: { name: true },
                });
                await this.notificationsService.create(payload.patientId, 'ORDER_UPDATE', message);
                this.logger.log(`Order update notification created for patient ${payload.patientId}`);
            }
        }
        catch (error) {
            this.logger.error(`Error handling order.status.updated event: ${error.message}`, error.stack);
        }
    }
    async handlePaymentStatusUpdated(payload) {
        try {
            const statusText = payload.newStatus === 'SUCCEEDED' ? 'successful' : 'failed';
            const message = `Your payment of ${payload.amount / 100} ${payload.currency} was ${statusText}.`;
            await this.notificationsService.create(payload.userId, 'PAYMENT_UPDATE', message);
            const user = await this.prisma.user.findUnique({
                where: { id: payload.userId },
                select: { email: true, name: true },
            });
            if (user) {
                await this.emailService.sendMail(user.email, `Payment ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`, `Dear ${user.name},\n\n${message}\n\nThank you for using our platform.`);
            }
        }
        catch (error) {
            this.logger.error(`Error handling payment.status.updated event: ${error.message}`, error.stack);
        }
    }
    async handleExpiryWarning(payload) {
        try {
            const expiryDateStr = payload.expiryDate.toLocaleDateString();
            await this.notifyAdminsAndPharmacies('EXPIRY_WARNING', `Expiry warning: "${payload.name}" expires on ${expiryDateStr}.`, `Medicine Expiry Warning: ${payload.name}`, `The medicine "${payload.name}" is expiring on ${expiryDateStr}. Please take action.`);
        }
        catch (error) {
            this.logger.error(`Error handling inventory.expiry_warning event: ${error.message}`, error.stack);
        }
    }
    async notifyAdminsAndPharmacies(type, inAppMessage, emailSubject, emailBody) {
        const users = await this.prisma.user.findMany({
            where: { role: { in: [client_1.Role.ADMIN, client_1.Role.PHARMACY] } },
            select: { id: true, email: true, name: true },
        });
        await Promise.all(users.map(async (user) => {
            await this.notificationsService.create(user.id, type, inAppMessage);
            await this.emailService.sendMail(user.email, emailSubject, `Dear ${user.name},\n\n${emailBody}\n\nThank you.`);
        }));
    }
};
exports.NotificationsListener = NotificationsListener;
__decorate([
    (0, event_emitter_1.OnEvent)(prescription_events_1.PRESCRIPTION_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handlePrescriptionCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(order_events_1.ORDER_STATUS_UPDATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handleOrderStatusUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(payment_events_1.PAYMENT_STATUS_UPDATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handlePaymentStatusUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(expiry_check_scheduler_1.INVENTORY_EXPIRY_WARNING),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handleExpiryWarning", null);
exports.NotificationsListener = NotificationsListener = NotificationsListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        email_service_1.EmailService])
], NotificationsListener);
//# sourceMappingURL=notifications.listener.js.map