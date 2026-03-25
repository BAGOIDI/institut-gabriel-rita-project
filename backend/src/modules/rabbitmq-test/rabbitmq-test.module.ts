import { Module } from '@nestjs/common';
import { RabbitMQTestController } from './rabbitmq-test.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672'],
          queue: 'school_events',
          queueOptions: {
            durable: true
          },
        },
      },
    ]),
  ],
  controllers: [RabbitMQTestController],
})
export class RabbitMQTestModule {}
