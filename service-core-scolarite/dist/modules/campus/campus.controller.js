"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampusController = void 0;
const common_1 = require("@nestjs/common");
const campus_service_1 = require("./campus.service");
const campus_dto_1 = require("./campus.dto");
let CampusController = class CampusController {
    constructor(campusService) {
        this.campusService = campusService;
    }
    async create(createCampusDto) {
        return await this.campusService.create(createCampusDto);
    }
    async findAll() {
        return await this.campusService.findAll();
    }
    async findOne(id) {
        return await this.campusService.findOne(id);
    }
    async update(id, updateCampusDto) {
        return await this.campusService.update(id, updateCampusDto);
    }
    async remove(id) {
        return await this.campusService.remove(id);
    }
};
exports.CampusController = CampusController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [campus_dto_1.CreateCampusDto]),
    __metadata("design:returntype", Promise)
], CampusController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CampusController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CampusController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, campus_dto_1.UpdateCampusDto]),
    __metadata("design:returntype", Promise)
], CampusController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CampusController.prototype, "remove", null);
exports.CampusController = CampusController = __decorate([
    (0, common_1.Controller)('campus'),
    __metadata("design:paramtypes", [campus_service_1.CampusService])
], CampusController);
//# sourceMappingURL=campus.controller.js.map