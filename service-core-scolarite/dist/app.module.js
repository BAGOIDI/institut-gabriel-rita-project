"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const campus_module_1 = require("./modules/campus/campus.module");
const user_entity_1 = require("./entities/user.entity");
const campus_entity_1 = require("./modules/campus/campus.entity");
const role_entity_1 = require("./entities/role.entity");
const staff_entity_1 = require("./entities/staff.entity");
const student_entity_1 = require("./entities/student.entity");
const academic_year_entity_1 = require("./entities/academic-year.entity");
const class_entity_1 = require("./entities/class.entity");
const grade_entity_1 = require("./entities/grade.entity");
const invoice_entity_1 = require("./entities/invoice.entity");
const payment_entity_1 = require("./entities/payment.entity");
const semester_entity_1 = require("./entities/semester.entity");
const specialty_entity_1 = require("./entities/specialty.entity");
const subject_entity_1 = require("./entities/subject.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DATABASE_HOST || 'localhost',
                port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
                username: process.env.DATABASE_USER || 'postgres',
                password: process.env.DATABASE_PASSWORD || 'postgres',
                database: process.env.DATABASE_NAME || 'scolarite_db',
                entities: [
                    user_entity_1.User,
                    campus_entity_1.Campus,
                    role_entity_1.Role,
                    staff_entity_1.Staff,
                    student_entity_1.Student,
                    academic_year_entity_1.AcademicYear,
                    class_entity_1.Class,
                    grade_entity_1.Grade,
                    invoice_entity_1.Invoice,
                    payment_entity_1.Payment,
                    semester_entity_1.Semester,
                    specialty_entity_1.Specialty,
                    subject_entity_1.Subject
                ],
                autoLoadEntities: true,
                synchronize: process.env.NODE_ENV !== 'production',
            }),
            campus_module_1.CampusModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map