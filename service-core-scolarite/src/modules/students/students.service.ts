import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../entities/student.entity';
import { CreateStudentDto } from './dto/create-students.dto';
import { UpdateStudentDto } from './dto/update-students.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @Inject('RABBITMQ_SERVICE') private client: ClientProxy,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const student = this.studentRepository.create(createStudentDto);
    const savedStudent = await this.studentRepository.save(student);
    this.client.emit('student.created', savedStudent);
    return savedStudent;
  }

  async findAll(): Promise<Student[]> {
    return await this.studentRepository.find();
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({ where: { id } });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.studentRepository.preload({
      id: id,
      ...updateStudentDto,
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    const savedStudent = await this.studentRepository.save(student);
    this.client.emit('student.created', savedStudent);
    return savedStudent;
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentRepository.remove(student);
  }
}
