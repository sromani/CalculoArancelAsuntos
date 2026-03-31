import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const esProd = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: esProd
      ? (process.env.FRONTEND_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean) ?? [
          'http://localhost:3002',
        ])
      : (origin, cb) => {
          // En dev: localhost y 127.0.0.1 en cualquier puerto (evita "Failed to fetch" por CORS)
          if (!origin) {
            return cb(null, true);
          }
          try {
            const u = new URL(origin);
            if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
              return cb(null, true);
            }
          } catch {
            /* ignore */
          }
          return cb(null, false);
        },
    credentials: true,
  });
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  
  console.log(`🚀 Backend corriendo en: http://localhost:${port}`);
}
bootstrap();