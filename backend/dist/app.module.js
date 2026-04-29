"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppModule", {
    enumerable: true,
    get: function() {
        return AppModule;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _eventemitter = require("@nestjs/event-emitter");
const _schedule = require("@nestjs/schedule");
const _appcontroller = require("./app.controller");
const _appservice = require("./app.service");
const _configuration = require("./config/configuration");
const _prismamodule = require("./prisma/prisma.module");
const _authmodule = require("./auth/auth.module");
const _healthmodule = require("./health/health.module");
const _patientsmodule = require("./patients/patients.module");
const _inventorymodule = require("./inventory/inventory.module");
const _prescriptionsmodule = require("./prescriptions/prescriptions.module");
const _ordersmodule = require("./orders/orders.module");
const _paymentsmodule = require("./payments/payments.module");
const _notificationsmodule = require("./notifications/notifications.module");
const _salesmodule = require("./sales/sales.module");
const _tenantmodule = require("./tenant/tenant.module");
const _doctormodule = require("./doctor/doctor.module");
const _patientmodule = require("./patient/patient.module");
const _patientportalmodule = require("./patient-portal/patient-portal.module");
const _pharmacymodule = require("./pharmacy/pharmacy.module");
const _adminmodule = require("./admin/admin.module");
const _tenantcontextmiddleware = require("./tenant/tenant-context.middleware");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(_tenantcontextmiddleware.TenantContextMiddleware).forRoutes('*');
    }
};
AppModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _config.ConfigModule.forRoot({
                isGlobal: true,
                load: [
                    _configuration.configuration
                ],
                validationSchema: _configuration.configValidationSchema
            }),
            _eventemitter.EventEmitterModule.forRoot(),
            _schedule.ScheduleModule.forRoot(),
            _prismamodule.PrismaModule,
            _authmodule.AuthModule,
            _healthmodule.HealthModule,
            _tenantmodule.TenantModule,
            _patientsmodule.PatientsModule,
            _inventorymodule.InventoryModule,
            _prescriptionsmodule.PrescriptionsModule,
            _ordersmodule.OrdersModule,
            _paymentsmodule.PaymentsModule,
            _notificationsmodule.NotificationsModule,
            _salesmodule.SalesModule,
            _doctormodule.DoctorModule,
            _patientmodule.PatientModule,
            _patientportalmodule.PatientPortalModule,
            _pharmacymodule.PharmacyModule,
            _adminmodule.AdminModule
        ],
        controllers: [
            _appcontroller.AppController
        ],
        providers: [
            _appservice.AppService
        ]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map