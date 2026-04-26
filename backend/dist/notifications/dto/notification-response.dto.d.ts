export declare class NotificationResponseDto {
    id: string;
    userId: string;
    type: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
}
export declare class PaginatedNotificationsResponseDto {
    data: NotificationResponseDto[];
    total: number;
    page: number;
    limit: number;
}
export declare class UnreadCountResponseDto {
    count: number;
}
