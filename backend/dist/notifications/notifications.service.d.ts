import { PrismaService } from '../prisma/prisma.service';
import { NotificationResponseDto, PaginatedNotificationsResponseDto, UnreadCountResponseDto } from './dto/notification-response.dto';
export declare class NotificationsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(userId: string, type: string, message: string): Promise<NotificationResponseDto>;
    findAll(userId: string, page?: number, limit?: number): Promise<PaginatedNotificationsResponseDto>;
    markRead(id: string, userId: string): Promise<NotificationResponseDto>;
    getUnreadCount(userId: string): Promise<UnreadCountResponseDto>;
}
