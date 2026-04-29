"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InventoryModule", {
    enumerable: true,
    get: function() {
        return InventoryModule;
    }
});
const _common = require("@nestjs/common");
const _inventorycontroller = require("./inventory.controller");
const _inventoryservice = require("./inventory.service");
const _prismamodule = require("../prisma/prisma.module");
const _authmodule = require("../auth/auth.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let InventoryModule = class InventoryModule {
};
InventoryModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _prismamodule.PrismaModule,
            _authmodule.AuthModule
        ],
        controllers: [
            _inventorycontroller.InventoryController
        ],
        providers: [
            _inventoryservice.InventoryService
        ],
        exports: [
            _inventoryservice.InventoryService
        ]
    })
], InventoryModule);

//# sourceMappingURL=inventory.module.js.map