"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AllExceptionsFilter", {
    enumerable: true,
    get: function() {
        return AllExceptionsFilter;
    }
});
const _common = require("@nestjs/common");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = 500;
        let message = 'Internal server error';
        // Handle HttpException (includes validation errors, auth errors, etc.)
        if (exception instanceof _common.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            // For HttpException, use the provided message
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const responseObj = exceptionResponse;
                message = responseObj.message || message;
            } else {
                message = exceptionResponse;
            }
        } else if (exception instanceof Error) {
            // For other errors, log the full error with stack trace
            this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
        } else {
            // For unknown error types
            this.logger.error(`Unhandled exception: ${JSON.stringify(exception)}`);
        }
        // Log error-level message with stack trace for unhandled exceptions
        if (!(exception instanceof _common.HttpException)) {
            const errorMessage = exception instanceof Error ? exception.message : 'Unknown error';
            const stackTrace = exception instanceof Error ? exception.stack : '';
            this.logger.error(`${errorMessage}\n${stackTrace}`);
        }
        // Return generic error response for 500 errors
        response.status(status).json({
            message: status === 500 ? 'Internal server error' : message,
            statusCode: status
        });
    }
    constructor(){
        this.logger = new _common.Logger('ExceptionFilter');
    }
};
AllExceptionsFilter = _ts_decorate([
    (0, _common.Catch)()
], AllExceptionsFilter);

//# sourceMappingURL=http-exception.filter.js.map