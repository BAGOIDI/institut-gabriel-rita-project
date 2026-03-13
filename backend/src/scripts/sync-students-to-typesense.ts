import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../modules/students/student.entity';
import { SearchIndexerService } from '../search-indexer.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const studentRepo = app.get<Repository<Student>>(getRepositoryToken(Student));
  const searchIndexer = app.get(SearchIndexerService);

  const students = await studentRepo.find();
  console.log(`🔍 Found ${students.length} students to sync to Typesense`);

  for (const student of students) {
    try {
      await searchIndexer.upsertStudent(student);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`❌ Error indexing student ${student.email}`, e);
    }
  }

  await app.close();
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Error syncing students to Typesense', e);
  process.exit(1);
});

