import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // removes unknown fields
      forbidNonWhitelisted: true, // throws error if forbidden field is sent
      transform: true,          // automatically transform payloads to DTO classes
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
