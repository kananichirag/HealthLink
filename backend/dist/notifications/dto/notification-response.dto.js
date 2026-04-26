"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnreadCountResponseDto = exports.PaginatedNotificationsResponseDto = exports.NotificationResponseDto = void 0;
class NotificationResponseDto {
    id;
    userId;
    type;
    message;
    isRead;
    createdAt;
}
exports.NotificationResponseDto = NotificationResponseDto;
class PaginatedNotificationsResponseDto {
    data;
    total;
    page;
    limit;
}
exports.PaginatedNotificationsResponseDto = PaginatedNotificationsResponseDto;
class UnreadCountResponseDto {
    count;
}
exports.UnreadCountResponseDto = UnreadCountResponseDto;
//# sourceMappingURL=notification-response.dto.js.map