"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NotificationsService", {
    enumerable: true,
    get: function() {
        return NotificationsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let NotificationsService = class NotificationsService {
    async create(userId, type, message) {
        const notification = await this.prisma.notification.create({
            data: {
                user: {
                    connect: {
                        id: userId
                    }
                },
                type,
                message,
                isRead: false
            }
        });
        return notification;
    }
    async findAll(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [total, notifications] = await Promise.all([
            this.prisma.notification.count({
                where: {
                    userId
                }
            }),
            this.prisma.notification.findMany({
                where: {
                    userId
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            })
        ]);
        return {
            data: notifications,
            total,
            page,
            limit
        };
    }
    async markRead(id, userId) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id,
                userId
            }
        });
        if (!notification) {
            throw new _common.NotFoundException(`Notification with ID ${id} not found`);
        }
        return this.prisma.notification.update({
            where: {
                id
            },
            data: {
                isRead: true
            }
        });
    }
    async getUnreadCount(userId) {
        const count = await this.prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        });
        return {
            count
        };
    }
    constructor(prisma){
        this.prisma = prisma;
        this.logger = new _common.Logger(NotificationsService.name);
    }
};
NotificationsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], NotificationsService);

//# sourceMappingURL=notifications.service.js.map