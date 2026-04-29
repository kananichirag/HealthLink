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
    get getTenantContext () {
        return getTenantContext;
    },
    get tenantStorage () {
        return tenantStorage;
    }
});
const _async_hooks = require("async_hooks");
const tenantStorage = new _async_hooks.AsyncLocalStorage();
function getTenantContext() {
    return tenantStorage.getStore() ?? {
        tenantId: null,
        role: null
    };
}

//# sourceMappingURL=tenant-context.js.map