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
    get PRESCRIPTION_CANCELLED () {
        return PRESCRIPTION_CANCELLED;
    },
    get PRESCRIPTION_CREATED () {
        return PRESCRIPTION_CREATED;
    }
});
const PRESCRIPTION_CREATED = 'prescription.created';
const PRESCRIPTION_CANCELLED = 'prescription.cancelled';

//# sourceMappingURL=prescription.events.js.map