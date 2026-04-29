"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PatientPortalModule", {
    enumerable: true,
    get: function() {
        return PatientPortalModule;
    }
});
const _common = require("@nestjs/common");
const _patientportalcontroller = require("./patient-portal.controller");
const _patientportalservice = require("./patient-portal.service");
const _prismamodule = require("../prisma/prisma.module");
const _authmodule = require("../auth/auth.module");
const _notificationsmodule = require("../notifications/notifications.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let PatientPortalModule = class PatientPortalModule {
};
PatientPortalModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _prismamodule.PrismaModule,
            _authmodule.AuthModule,
            _notificationsmodule.NotificationsModule
        ],
        controllers: [
            _patientportalcontroller.PatientPortalController
        ],
        providers: [
            _patientportalservice.PatientPortalService
        ],
        exports: [
            _patientportalservice.PatientPortalService
        ]
    })
], PatientPortalModule);

//# sourceMappingURL=patient-portal.module.js.map