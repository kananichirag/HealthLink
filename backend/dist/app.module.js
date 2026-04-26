"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const configuration_1 = require("./config/configuration");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const health_module_1 = require("./health/health.module");
const patients_module_1 = require("./patients/patients.module");
const inventory_module_1 = require("./inventory/inventory.module");
const prescriptions_module_1 = require("./prescriptions/prescriptions.module");
const orders_module_1 = require("./orders/orders.module");
const payments_module_1 = require("./payments/payments.module");
const notifications_module_1 = require("./notifications/notifications.module");
const sales_module_1 = require("./sales/sales.module");
const tenant_module_1 = require("./tenant/tenant.module");
const doctor_module_1 = require("./doctor/doctor.module");
const patient_portal_module_1 = require("./patient-portal/patient-portal.module");
const pharmacy_module_1 = require("./pharmacy/pharmacy.module");
const admin_module_1 = require("./admin/admin.module");
const tenant_context_middleware_1 = require("./tenant/tenant-context.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(tenant_context_middleware_1.TenantContextMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.configuration],
                validationSchema: configuration_1.configValidationSchema,
            }),
            event_emitter_1.EventEmitterModule.forRoot(),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            health_module_1.HealthModule,
            tenant_module_1.TenantModule,
            patients_module_1.PatientsModule,
            inventory_module_1.InventoryModule,
            prescriptions_module_1.PrescriptionsModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            notifications_module_1.NotificationsModule,
            sales_module_1.SalesModule,
            doctor_module_1.DoctorModule,
            patient_portal_module_1.PatientPortalModule,
            pharmacy_module_1.PharmacyModule,
            admin_module_1.AdminModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map