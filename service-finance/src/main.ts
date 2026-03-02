import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Global Validation Pipe (Best Practice)
  // Whitelist: strips properties that are not in the DTO
  // Transform: automatically converts payloads to DTO instances
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // 2. Swagger Documentation (Best Practice)
  const config = new DocumentBuilder()
    .setTitle('Finance Microservice')
    .setDescription('API for managing payments, fees, and reports')
    .setVersion('1.0')
    .addTag('finance')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Finance service is running on port ${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();