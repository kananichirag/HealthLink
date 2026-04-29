"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get TenantQueryDto () {
        return _tenantquerydto.TenantQueryDto;
    },
    get UserQueryDto () {
        return _userquerydto.UserQueryDto;
    }
});
const _tenantquerydto = require("./tenant-query.dto");
const _userquerydto = require("./user-query.dto");

//# sourceMappingURL=index.js.map