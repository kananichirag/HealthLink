"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NotificationsListener", {
    enumerable: true,
    get: function() {
        return NotificationsListener;
    }
});
const _common = require("@nestjs/common");
const _eventemitter = require("@nestjs/event-emitter");
const _prismaservice = require("../prisma/prisma.service");
const _notificationsservice = require("./notifications.service");
const _emailservice = require("./email.service");
const _prescriptionevents = require("../prescriptions/events/prescription.events");
const _orderevents = require("../orders/events/order.events");
const _paymentevents = require("../payments/events/payment.events");
const _expirycheckscheduler = require("./scheduler/expiry-check.scheduler");
const _client = require("@prisma/client");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const LOW_STOCK_THRESHOLD = 10;
let NotificationsListener = class NotificationsListener {
    async handlePrescriptionCreated(payload) {
        try {
            // Check for low stock medicines
            for (const medicine of payload.medicines){
                if (medicine.newQuantity < LOW_STOCK_THRESHOLD) {
                    await this.notifyAdminsAndPharmacies('LOW_STOCK', `Low stock alert: "${medicine.name}" has only ${medicine.newQuantity} units remaining.`, `Low Stock Alert: ${medicine.name}`, `The medicine "${medicine.name}" is running low. Current stock: ${medicine.newQuantity} units.`);
                }
            }
        } catch (error) {
            this.logger.error(`Error handling prescription.created event: ${error.message}`, error.stack);
        }
    }
    async handleOrderStatusUpdated(payload) {
        try {
            if (payload.newStatus === 'SHIPPED' || payload.newStatus === 'DELIVERED') {
                const message = payload.trackingInfo ? `Your order has been ${payload.newStatus.toLowerCase()}. Tracking: ${payload.trackingInfo}` : `Your order has been ${payload.newStatus.toLowerCase()}.`;
                // Find patient's user account for email
                const patient = await this.prisma.patient.findUnique({
                    where: {
                        id: payload.patientId
                    },
                    select: {
                        name: true
                    }
                });
                // Create in-app notification for the patient's user
                // Note: patientId here is the Patient record id; we need to find associated user
                // For now, we store notification with patientId as userId (they may differ)
                await this.notificationsService.create(payload.patientId, 'ORDER_UPDATE', message);
                this.logger.log(`Order update notification created for patient ${payload.patientId}`);
            }
        } catch (error) {
            this.logger.error(`Error handling order.status.updated event: ${error.message}`, error.stack);
        }
    }
    async handlePaymentStatusUpdated(payload) {
        try {
            const statusText = payload.newStatus === 'SUCCEEDED' ? 'successful' : 'failed';
            const message = `Your payment of ${payload.amount / 100} ${payload.currency} was ${statusText}.`;
            await this.notificationsService.create(payload.userId, 'PAYMENT_UPDATE', message);
            // Send email
            const user = await this.prisma.user.findUnique({
                where: {
                    id: payload.userId
                },
                select: {
                    email: true,
                    name: true
                }
            });
            if (user) {
                await this.emailService.sendMail(user.email, `Payment ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`, `Dear ${user.name},\n\n${message}\n\nThank you for using our platform.`);
            }
        } catch (error) {
            this.logger.error(`Error handling payment.status.updated event: ${error.message}`, error.stack);
        }
    }
    async handleExpiryWarning(payload) {
        try {
            const expiryDateStr = payload.expiryDate.toLocaleDateString();
            await this.notifyAdminsAndPharmacies('EXPIRY_WARNING', `Expiry warning: "${payload.name}" expires on ${expiryDateStr}.`, `Medicine Expiry Warning: ${payload.name}`, `The medicine "${payload.name}" is expiring on ${expiryDateStr}. Please take action.`);
        } catch (error) {
            this.logger.error(`Error handling inventory.expiry_warning event: ${error.message}`, error.stack);
        }
    }
    async notifyAdminsAndPharmacies(type, inAppMessage, emailSubject, emailBody) {
        const users = await this.prisma.user.findMany({
            where: {
                role: {
                    in: [
                        _client.Role.ADMIN,
                        _client.Role.PHARMACY
                    ]
                }
            },
            select: {
                id: true,
                email: true,
                name: true
            }
        });
        await Promise.all(users.map(async (user)=>{
            await this.notificationsService.create(user.id, type, inAppMessage);
            await this.emailService.sendMail(user.email, emailSubject, `Dear ${user.name},\n\n${emailBody}\n\nThank you.`);
        }));
    }
    constructor(prisma, notificationsService, emailService){
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.emailService = emailService;
        this.logger = new _common.Logger(NotificationsListener.name);
    }
};
_ts_decorate([
    (0, _eventemitter.OnEvent)(_prescriptionevents.PRESCRIPTION_CREATED),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof PrescriptionCreatedPayload === "undefined" ? Object : PrescriptionCreatedPayload
    ]),
    _ts_metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handlePrescriptionCreated", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)(_orderevents.ORDER_STATUS_UPDATED),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof OrderStatusUpdatedPayload === "undefined" ? Object : OrderStatusUpdatedPayload
    ]),
    _ts_metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handleOrderStatusUpdated", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)(_paymentevents.PAYMENT_STATUS_UPDATED),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof PaymentStatusUpdatedPayload === "undefined" ? Object : PaymentStatusUpdatedPayload
    ]),
    _ts_metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handlePaymentStatusUpdated", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)(_expirycheckscheduler.INVENTORY_EXPIRY_WARNING),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof ExpiryWarningPayload === "undefined" ? Object : ExpiryWarningPayload
    ]),
    _ts_metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handleExpiryWarning", null);
NotificationsListener = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _notificationsservice.NotificationsService === "undefined" ? Object : _notificationsservice.NotificationsService,
        typeof _emailservice.EmailService === "undefined" ? Object : _emailservice.EmailService
    ])
], NotificationsListener);

//# sourceMappingURL=notifications.listener.js.map