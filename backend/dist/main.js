"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _core = require("@nestjs/core");
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _appmodule = require("./app.module");
const _httpexceptionfilter = require("./common/filters/http-exception.filter");
const _express = /*#__PURE__*/ _interop_require_wildcard(require("express"));
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
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule);
    const configService = app.get(_config.ConfigService);
    const logger = new _common.Logger('Bootstrap');
    // Raw body middleware for Stripe webhook — MUST be before global JSON parser and ValidationPipe
    app.use('/payments/webhook', _express.raw({
        type: 'application/json'
    }));
    // Enable CORS for frontend communication
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ],
        methods: [
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'PATCH',
            'OPTIONS'
        ],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'Bearer'
        ],
        credentials: true
    });
    // Register global exception filter
    app.useGlobalFilters(new _httpexceptionfilter.AllExceptionsFilter());
    // Register global ValidationPipe
    app.useGlobalPipes(new _common.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true
    }));
    const port = configService.get('port') || 3000;
    await app.listen(port);
    logger.log(`Application is running on port ${port}`);
}
bootstrap();

//# sourceMappingURL=main.js.map