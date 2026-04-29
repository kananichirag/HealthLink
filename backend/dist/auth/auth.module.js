"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthModule", {
    enumerable: true,
    get: function() {
        return AuthModule;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _passport = require("@nestjs/passport");
const _config = require("@nestjs/config");
const _authservice = require("./auth.service");
const _authcontroller = require("./auth.controller");
const _prismamodule = require("../prisma/prisma.module");
const _tenantmodule = require("../tenant/tenant.module");
const _jwtstrategy = require("./strategies/jwt.strategy");
const _jwtauthguard = require("./guards/jwt-auth.guard");
const _rolesguard = require("./guards/roles.guard");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AuthModule = class AuthModule {
};
AuthModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _prismamodule.PrismaModule,
            _passport.PassportModule,
            _tenantmodule.TenantModule,
            _jwt.JwtModule.registerAsync({
                inject: [
                    _config.ConfigService
                ],
                useFactory: (configService)=>{
                    const secret = configService.get('jwt.secret') || '';
                    const expiresIn = configService.get('jwt.expiresIn') || '7d';
                    return {
                        secret,
                        signOptions: {
                            expiresIn: expiresIn
                        }
                    };
                }
            })
        ],
        controllers: [
            _authcontroller.AuthController
        ],
        providers: [
            _authservice.AuthService,
            _jwtstrategy.JwtStrategy,
            _jwtauthguard.JwtAuthGuard,
            _rolesguard.RolesGuard
        ],
        exports: [
            _authservice.AuthService,
            _jwtauthguard.JwtAuthGuard,
            _rolesguard.RolesGuard
        ]
    })
], AuthModule);

//# sourceMappingURL=auth.module.js.map