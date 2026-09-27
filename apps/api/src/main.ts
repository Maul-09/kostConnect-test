import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers (Helmet)
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }),
  );

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('KosConnect ERP API')
    .setDescription('Mini Property ERP API Documentation for Technical Assessment')
    .setVersion('1.0')
    .addTag('Properties', 'Modul 1: Property & Room Management (Asset)')
    .addTag('Tenants', 'Modul 2: Tenant & Lease Contract (CRM)')
    .addTag('Invoices', 'Modul 3: Billing & Payments (Financial)')
    .addTag('Payments', 'Midtrans Snap Integration')
    .addTag('Webhooks', 'Payment Gateway Callback Listener')
    .addTag('Currency', 'External Public API: Currency Exchange Rates (IDR/USD)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`KosConnect API is running on: http://localhost:${port}/api`);
  console.log(`Swagger Documentation is available at: http://localhost:${port}/api/docs`);
}

void bootstrap();
