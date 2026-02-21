import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  // 1. Démarrage de l'API HTTP (Port 3000)
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  
  // 2. Connexion au Broker RabbitMQ (Pour écouter les événements)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672'],
      queue: 'school_events',
      queueOptions: {
        durable: false
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
  console.log(`🚀 Core ERP API & Worker running on: ${await app.getUrl()}`);
}
bootstrap();
