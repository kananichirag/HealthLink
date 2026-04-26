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
var ExpiryCheckScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpiryCheckScheduler = exports.INVENTORY_EXPIRY_WARNING = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../prisma/prisma.service");
exports.INVENTORY_EXPIRY_WARNING = 'inventory.expiry_warning';
let ExpiryCheckScheduler = ExpiryCheckScheduler_1 = class ExpiryCheckScheduler {
    prisma;
    eventEmitter;
    logger = new common_1.Logger(ExpiryCheckScheduler_1.name);
    EXPIRY_WARNING_DAYS = 30;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async checkExpiringMedicines() {
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
                const payload = {
                    medicineId: medicine.id,
                    name: medicine.name,
                    expiryDate: medicine.expiryDate,
                };
                this.eventEmitter.emit(exports.INVENTORY_EXPIRY_WARNING, payload);
            }
            this.logger.log(`Expiry check complete. Found ${expiringMedicines.length} expiring medicines.`);
        }
        catch (error) {
            this.logger.error(`Expiry check failed: ${error.message}`, error.stack);
        }
    }
};
exports.ExpiryCheckScheduler = ExpiryCheckScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExpiryCheckScheduler.prototype, "checkExpiringMedicines", null);
exports.ExpiryCheckScheduler = ExpiryCheckScheduler = ExpiryCheckScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], ExpiryCheckScheduler);
//# sourceMappingURL=expiry-check.scheduler.js.map