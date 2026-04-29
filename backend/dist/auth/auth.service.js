"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthService", {
    enumerable: true,
    get: function() {
        return AuthService;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _prismaservice = require("../prisma/prisma.service");
const _tenantservice = require("../tenant/tenant.service");
const _bcrypt = /*#__PURE__*/ _interop_require_wildcard(require("bcrypt"));
const _client = require("@prisma/client");
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
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AuthService = class AuthService {
    async register(dto) {
        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (existingUser) {
            throw new _common.ConflictException('Email already in use');
        }
        // Hash password with bcrypt (salt round >= 10)
        const hashedPassword = await _bcrypt.hash(dto.password, 10);
        let tenantId;
        // Determine tenant assignment based on role
        if (dto.role === _client.Role.DOCTOR || dto.role === _client.Role.PHARMACY) {
            if (dto.tenantId) {
                // Joining an existing tenant — verify it exists and is active
                const tenant = await this.tenantService.findById(dto.tenantId);
                if (!tenant.isActive) {
                    throw new _common.ForbiddenException('Cannot join a deactivated tenant');
                }
                tenantId = dto.tenantId;
            } else if (dto.tenantName && dto.tenantType) {
                // Create a new tenant
                const tenant = await this.tenantService.createTenant({
                    name: dto.tenantName,
                    type: dto.tenantType
                });
                tenantId = tenant.id;
            } else {
                throw new _common.BadRequestException('Doctor and Pharmacy registrations require either tenantId or tenantName and tenantType');
            }
        }
        // PATIENT and ADMIN roles don't require a tenant
        // Create user
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                password: hashedPassword,
                role: dto.role,
                ...tenantId ? {
                    tenantId
                } : {}
            }
        });
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async login(dto) {
        // Validate user credentials
        const user = await this.validateUser(dto.email, dto.password);
        if (!user) {
            throw new _common.UnauthorizedException('Invalid credentials');
        }
        // If user has a tenant, check that the tenant is active
        if (user.tenantId) {
            const tenant = await this.tenantService.findById(user.tenantId);
            if (!tenant.isActive) {
                throw new _common.ForbiddenException('Your tenant has been deactivated');
            }
        }
        // Create JWT payload with tenantId
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId ?? null
        };
        // Sign and return JWT
        const access_token = this.jwtService.sign(payload);
        return {
            access_token
        };
    }
    async validateUser(email, password) {
        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: {
                email
            }
        });
        if (!user) {
            return null;
        }
        // Compare password with stored hash
        const isPasswordValid = await _bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }
        return user;
    }
    constructor(prisma, jwtService, tenantService){
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.tenantService = tenantService;
    }
};
AuthService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService,
        typeof _tenantservice.TenantService === "undefined" ? Object : _tenantservice.TenantService
    ])
], AuthService);

//# sourceMappingURL=auth.service.js.map