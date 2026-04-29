"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SalesModule", {
    enumerable: true,
    get: function() {
        return SalesModule;
    }
});
const _common = require("@nestjs/common");
const _salescontroller = require("./sales.controller");
const _salesservice = require("./sales.service");
const _prismamodule = require("../prisma/prisma.module");
const _authmodule = require("../auth/auth.module");
const _inventorymodule = require("../inventory/inventory.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let SalesModule = class SalesModule {
};
SalesModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _prismamodule.PrismaModule,
            _authmodule.AuthModule,
            _inventorymodule.InventoryModule
        ],
        controllers: [
            _salescontroller.SalesController
        ],
        providers: [
            _salesservice.SalesService
        ],
        exports: [
            _salesservice.SalesService
        ]
    })
], SalesModule);

//# sourceMappingURL=sales.module.js.map