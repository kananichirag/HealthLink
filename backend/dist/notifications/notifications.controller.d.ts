import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(req: any, page: number, limit: number): Promise<import("./dto/notification-response.dto").PaginatedNotificationsResponseDto>;
    getUnreadCount(req: any): Promise<import("./dto/notification-response.dto").UnreadCountResponseDto>;
    markRead(id: string, req: any): Promise<import("./dto/notification-response.dto").NotificationResponseDto>;
}
