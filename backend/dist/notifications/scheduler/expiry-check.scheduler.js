"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get ExpiryCheckScheduler () {
        return ExpiryCheckScheduler;
    },
    get INVENTORY_EXPIRY_WARNING () {
        return INVENTORY_EXPIRY_WARNING;
    }
});
const _common = require("@nestjs/common");
const _schedule = require("@nestjs/schedule");
const _eventemitter = require("@nestjs/event-emitter");
const _prismaservice = require("../../prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const INVENTORY_EXPIRY_WARNING = 'inventory.expiry_warning';
let ExpiryCheckScheduler = class ExpiryCheckScheduler {
    async checkExpiringMedicines() {
        this.logger.log('Running daily expiry check...');
        const now = new Date();
        const warningDate = new Date();
        warningDate.setDate(now.getDate() + this.EXPIRY_WARNING_DAYS);
        try {
            const expiringMedicines = await this.prisma.medicine.findMany({
                where: {
                    expiryDate: {
                        gte: now,
                        lte: warningDate
                    }
                },
                select: {
                    id: true,
                    name: true,
                    expiryDate: true
                }
            });
            for (const medicine of expiringMedicines){
                const payload = {
                    medicineId: medicine.id,
                    name: medicine.name,
                    expiryDate: medicine.expiryDate
                };
                this.eventEmitter.emit(INVENTORY_EXPIRY_WARNING, payload);
            }
            this.logger.log(`Expiry check complete. Found ${expiringMedicines.length} expiring medicines.`);
        } catch (error) {
            this.logger.error(`Expiry check failed: ${error.message}`, error.stack);
        }
    }
    constructor(prisma, eventEmitter){
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.logger = new _common.Logger(ExpiryCheckScheduler.name);
        this.EXPIRY_WARNING_DAYS = 30;
    }
};
_ts_decorate([
    (0, _schedule.Cron)(_schedule.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], ExpiryCheckScheduler.prototype, "checkExpiringMedicines", null);
ExpiryCheckScheduler = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _eventemitter.EventEmitter2 === "undefined" ? Object : _eventemitter.EventEmitter2
    ])
], ExpiryCheckScheduler);

//# sourceMappingURL=expiry-check.scheduler.js.map