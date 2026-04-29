"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AdminController", {
    enumerable: true,
    get: function() {
        return AdminController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _rolesguard = require("../auth/guards/roles.guard");
const _rolesdecorator = require("../auth/decorators/roles.decorator");
const _client = require("@prisma/client");
const _adminservice = require("./admin.service");
const _dto = require("./dto");
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
let AdminController = class AdminController {
    async listTenants(query) {
        return this.adminService.listTenants(query);
    }
    async activateTenant(id) {
        return this.adminService.activateTenant(id);
    }
    async deactivateTenant(id) {
        return this.adminService.deactivateTenant(id);
    }
    async listUsers(query) {
        return this.adminService.listUsers(query);
    }
    async activateUser(id) {
        return this.adminService.activateUser(id);
    }
    async deactivateUser(id) {
        return this.adminService.deactivateUser(id);
    }
    constructor(adminService){
        this.adminService = adminService;
    }
};
_ts_decorate([
    (0, _common.Get)('tenants'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.TenantQueryDto === "undefined" ? Object : _dto.TenantQueryDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "listTenants", null);
_ts_decorate([
    (0, _common.Patch)('tenants/:id/activate'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "activateTenant", null);
_ts_decorate([
    (0, _common.Patch)('tenants/:id/deactivate'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "deactivateTenant", null);
_ts_decorate([
    (0, _common.Get)('users'),
    _ts_param(0, (0, _common.Query)(new _common.ValidationPipe({
        whitelist: true,
        transform: true
    }))),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.UserQueryDto === "undefined" ? Object : _dto.UserQueryDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "listUsers", null);
_ts_decorate([
    (0, _common.Patch)('users/:id/activate'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "activateUser", null);
_ts_decorate([
    (0, _common.Patch)('users/:id/deactivate'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "deactivateUser", null);
AdminController = _ts_decorate([
    (0, _common.Controller)('admin'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_client.Role.ADMIN),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _adminservice.AdminService === "undefined" ? Object : _adminservice.AdminService
    ])
], AdminController);

//# sourceMappingURL=admin.controller.js.map