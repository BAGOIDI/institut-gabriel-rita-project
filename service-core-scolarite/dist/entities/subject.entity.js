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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subject = void 0;
const typeorm_1 = require("typeorm");
const class_entity_1 = require("./class.entity");
const semester_entity_1 = require("./semester.entity");
const grade_entity_1 = require("./grade.entity");
let Subject = class Subject {
};
exports.Subject = Subject;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Subject.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Subject.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Subject.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => class_entity_1.Class, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'class_id' }),
    __metadata("design:type", class_entity_1.Class)
], Subject.prototype, "class", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => semester_entity_1.Semester, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'semester_id' }),
    __metadata("design:type", semester_entity_1.Semester)
], Subject.prototype, "semester", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], Subject.prototype, "coefficient", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Subject.prototype, "creditsEcts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => grade_entity_1.Grade, grade => grade.subject),
    __metadata("design:type", Array)
], Subject.prototype, "grades", void 0);
exports.Subject = Subject = __decorate([
    (0, typeorm_1.Entity)({ name: 'subjects' })
], Subject);
//# sourceMappingURL=subject.entity.js.map