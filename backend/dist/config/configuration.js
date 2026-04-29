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
    get configValidationSchema () {
        return configValidationSchema;
    },
    get configuration () {
        return configuration;
    }
});
const _joi = /*#__PURE__*/ _interop_require_wildcard(require("joi"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const configValidationSchema = _joi.object({
    DATABASE_URL: _joi.string().required(),
    JWT_SECRET: _joi.string().required(),
    JWT_EXPIRES_IN: _joi.string().required(),
    PORT: _joi.number().default(3000),
    // Stripe — optional; services will warn at startup if absent
    STRIPE_SECRET_KEY: _joi.string().optional(),
    STRIPE_WEBHOOK_SECRET: _joi.string().optional(),
    // SMTP — optional; services will warn at startup if absent
    SMTP_HOST: _joi.string().optional(),
    SMTP_PORT: _joi.number().default(587),
    SMTP_USER: _joi.string().optional(),
    SMTP_PASS: _joi.string().optional(),
    SMTP_FROM: _joi.string().optional(),
    // Pharmacy — optional; services will use fallback defaults if absent
    PHARMACY_NAME: _joi.string().optional(),
    PHARMACY_ADDRESS: _joi.string().optional()
});
const configuration = ()=>({
        database: {
            url: process.env.DATABASE_URL
        },
        jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN
        },
        port: parseInt(process.env.PORT || '3000', 10),
        stripe: {
            secretKey: process.env.STRIPE_SECRET_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
        },
        smtp: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
            from: process.env.SMTP_FROM
        },
        pharmacy: {
            name: process.env.PHARMACY_NAME || 'Pharmacy',
            address: process.env.PHARMACY_ADDRESS || 'Address not configured'
        }
    });

//# sourceMappingURL=configuration.js.map