"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
_export_star(require("./create-sale.dto"), exports);
_export_star(require("./sale-response.dto"), exports);
_export_star(require("./sale-item-response.dto"), exports);
_export_star(require("./invoice-response.dto"), exports);
_export_star(require("./daily-report-response.dto"), exports);
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