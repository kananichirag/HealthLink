"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PharmacyModule", {
    enumerable: true,
    get: function() {
        return PharmacyModule;
    }
});
const _common = require("@nestjs/common");
const _pharmacycontroller = require("./pharmacy.controller");
const _pharmacyservice = require("./pharmacy.service");
const _prismamodule = require("../prisma/prisma.module");
const _authmodule = require("../auth/auth.module");
const _notificationsmodule = require("../notifications/notifications.module");
const _salesmodule = require("../sales/sales.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let PharmacyModule = class PharmacyModule {
};
PharmacyModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _prismamodule.PrismaModule,
            _authmodule.AuthModule,
            _notificationsmodule.NotificationsModule,
            _salesmodule.SalesModule
        ],
        controllers: [
            _pharmacycontroller.PharmacyController
        ],
        providers: [
            _pharmacyservice.PharmacyService
        ],
        exports: [
            _pharmacyservice.PharmacyService
        ]
    })
], PharmacyModule);

//# sourceMappingURL=pharmacy.module.js.map