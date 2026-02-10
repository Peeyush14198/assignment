import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Collections Case Manager API')
    .setDescription(
      'Case management APIs for list/create, rule-based assignment, action logging, dashboard metrics, and PDF reminders.'
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3001/api', 'Local development')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = Number(configService.get('API_PORT') ?? 3001);
  await app.listen(port);

  process.stdout.write(
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'server_started',
      port
    })}\n`
  );
}

bootstrap();
