import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. Enable CORS for Frontend (Vite runs on port 5173 or 80)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2. Connect to RabbitMQ
  app.connectMicroservice<MicroserviceOptions>({
    strategy: undefined,
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672'],
      queue: 'dashboard_queue',
      queueOptions: { durable: false },
    }
  });

  await app.startAllMicroservices();
  app.enableCors();
  await app.listen(3000);
  console.log(`Dashboard service is running on: ${await app.getUrl()}`);
}
bootstrap();