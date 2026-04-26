export class NotificationResponseDto {
  id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export class PaginatedNotificationsResponseDto {
  data: NotificationResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class UnreadCountResponseDto {
  count: number;
}
