import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { StaffService } from '../modules/staff/staff.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const staffService = app.get(StaffService);

  // On charge tous les enseignants puis on réutilise la logique d'importMany
  const { items } = await staffService.findAll({ page: 1, limit: 1000 });
  const payload = items.map((s) => ({
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    phoneNumber: s.phoneNumber,
    specialty: s.specialty,
    contractType: s.contractType,
    status: s.status,
  })) as any;

  await staffService.importMany(payload);
  await app.close();
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Error syncing teachers to Typesense', e);
  process.exit(1);
});

