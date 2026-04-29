"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "JwtAuthGuard", {
    enumerable: true,
    get: function() {
        return JwtAuthGuard;
    }
});
const _common = require("@nestjs/common");
const _passport = require("@nestjs/passport");
const _tenantservice = require("../../tenant/tenant.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let JwtAuthGuard = class JwtAuthGuard extends (0, _passport.AuthGuard)('jwt') {
    async canActivate(context) {
        // First, run the standard JWT validation
        const isValid = await super.canActivate(context);
        if (!isValid) {
            return false;
        }
        // After JWT validation, check tenant active status
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user?.tenantId && this.tenantService) {
            const tenant = await this.tenantService.findById(user.tenantId);
            if (!tenant.isActive) {
                throw new _common.ForbiddenException('Your tenant has been deactivated');
            }
        }
        return true;
    }
    constructor(tenantService){
        super(), this.tenantService = tenantService;
    }
};
JwtAuthGuard = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Optional)()),
    _ts_param(0, (0, _common.Inject)(_tenantservice.TenantService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _tenantservice.TenantService === "undefined" ? Object : _tenantservice.TenantService
    ])
], JwtAuthGuard);

//# sourceMappingURL=jwt-auth.guard.js.map