"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OrdersController", {
    enumerable: true,
    get: function() {
        return OrdersController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _rolesguard = require("../auth/guards/roles.guard");
const _rolesdecorator = require("../auth/decorators/roles.decorator");
const _client = require("@prisma/client");
const _ordersservice = require("./orders.service");
const _createorderdto = require("./dto/create-order.dto");
const _updateorderstatusdto = require("./dto/update-order-status.dto");
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
let OrdersController = class OrdersController {
    create(dto, req) {
        return this.ordersService.createOrder(dto, req.user.sub);
    }
    findAll(page, limit) {
        return this.ordersService.findAll(page, limit);
    }
    findOne(id) {
        return this.ordersService.findById(id);
    }
    updateStatus(id, dto) {
        return this.ordersService.updateStatus(id, dto);
    }
    constructor(ordersService){
        this.ordersService = ordersService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _rolesdecorator.Roles)(_client.Role.PHARMACY, _client.Role.ADMIN),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createorderdto.CreateOrderDto === "undefined" ? Object : _createorderdto.CreateOrderDto,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _rolesdecorator.Roles)(_client.Role.PHARMACY, _client.Role.ADMIN),
    _ts_param(0, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _rolesdecorator.Roles)(_client.Role.PHARMACY, _client.Role.ADMIN),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id/status'),
    (0, _rolesdecorator.Roles)(_client.Role.PHARMACY, _client.Role.ADMIN),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updateorderstatusdto.UpdateOrderStatusDto === "undefined" ? Object : _updateorderstatusdto.UpdateOrderStatusDto
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "updateStatus", null);
OrdersController = _ts_decorate([
    (0, _common.Controller)('orders'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _ordersservice.OrdersService === "undefined" ? Object : _ordersservice.OrdersService
    ])
], OrdersController);

//# sourceMappingURL=orders.controller.js.map