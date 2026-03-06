import { AttendanceModule } from './modules/attendance/attendance.module';
import { SystemOptionsModule } from './modules/system-options/system-options.module';
import { SystemOption } from './modules/system-options/system-option.entity';
import { UserModule } from './modules/users/users.module';
import { SubjectModule } from './modules/subjects/subjects.module';
import { StudentModule } from './modules/students/students.module';
import { StaffModule } from './modules/staff/staff.module';
import { SpecialtyModule } from './modules/specialtys/specialtys.module';
import { SemesterModule } from './modules/semesters/semesters.module';
import { RoleModule } from './modules/roles/roles.module';
import { PaymentModule } from './modules/payments/payments.module';
import { InvoiceModule } from './modules/invoices/invoices.module';
import { GradeModule } from './modules/grades/grades.module';
import { ClassModule } from './modules/classes/classes.module';
import { AcademicYearModule } from './modules/academic-years/academic-years.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CampusModule } from './modules/campus/campus.module';
import { User } from './entities/user.entity';
import { Campus } from './modules/campus/campus.entity';
import { Role } from './entities/role.entity';
import { Staff } from './entities/staff.entity';
import { Student } from './entities/student.entity';
import { AcademicYear } from './entities/academic-year.entity';
import { Class } from './entities/class.entity';
import { Grade } from './entities/grade.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { Semester } from './entities/semester.entity';
import { Specialty } from './entities/specialty.entity';
import { Subject } from './entities/subject.entity';

@Module({
  imports: [
    AttendanceModule,
    SystemOptionsModule,
    UserModule,
    SubjectModule,
    StudentModule,
    StaffModule,
    SpecialtyModule,
    SemesterModule,
    RoleModule,
    PaymentModule,
    InvoiceModule,
    GradeModule,
    ClassModule,
    AcademicYearModule,

    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'scolarite_db',
      entities: [
        SystemOption,
        User,
        Campus,
        Role,
        Staff,
        Student,
        AcademicYear,
        Class,
        Grade,
        Invoice,
        Payment,
        Semester,
        Specialty,
        Subject
      ],
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production', // Ne jamais utiliser synchronize en production
    }),
    CampusModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}