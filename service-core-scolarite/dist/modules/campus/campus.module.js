"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampusModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const campus_entity_1 = require("./campus.entity");
const campus_controller_1 = require("./campus.controller");
const campus_service_1 = require("./campus.service");
const user_entity_1 = require("../../entities/user.entity");
let CampusModule = class CampusModule {
};
exports.CampusModule = CampusModule;
exports.CampusModule = CampusModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([campus_entity_1.Campus, user_entity_1.User])],
        controllers: [campus_controller_1.CampusController],
        providers: [campus_service_1.CampusService],
        exports: [campus_service_1.CampusService],
    })
], CampusModule);
//# sourceMappingURL=campus.module.js.map