import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private _extendedClient;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get user(): any;
    get patient(): any;
    get medicine(): any;
    get prescription(): any;
    get prescriptionItem(): any;
    get sale(): any;
    get saleItem(): any;
    get order(): any;
    get payment(): any;
    get notification(): any;
    get tenant(): any;
    get doctorPharmacyConnection(): any;
    get allergyReport(): any;
    get appointment(): any;
    get doctorSchedule(): any;
    get blockedDate(): any;
    get purchaseRecord(): any;
}
