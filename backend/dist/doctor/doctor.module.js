"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DoctorModule", {
    enumerable: true,
    get: function() {
        return DoctorModule;
    }
});
const _common = require("@nestjs/common");
const _doctorcontroller = require("./doctor.controller");
const _doctorservice = require("./doctor.service");
const _prismamodule = require("../prisma/prisma.module");
const _authmodule = require("../auth/auth.module");
const _notificationsmodule = require("../notifications/notifications.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let DoctorModule = class DoctorModule {
};
DoctorModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _prismamodule.PrismaModule,
            _authmodule.AuthModule,
            _notificationsmodule.NotificationsModule
        ],
        controllers: [
            _doctorcontroller.DoctorController
        ],
        providers: [
            _doctorservice.DoctorService
        ],
        exports: [
            _doctorservice.DoctorService
        ]
    })
], DoctorModule);

//# sourceMappingURL=doctor.module.js.map