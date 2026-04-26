import { DayOfWeek } from '@prisma/client';
export declare class AvailabilitySlotDto {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
}
export declare class SetAvailabilityDto {
    slots: AvailabilitySlotDto[];
}
