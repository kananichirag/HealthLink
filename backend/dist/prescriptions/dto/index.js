"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
_export_star(require("./create-prescription.dto"), exports);
_export_star(require("./update-prescription-status.dto"), exports);
_export_star(require("./prescription-response.dto"), exports);
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}

//# sourceMappingURL=index.js.map