import { existsSync } from 'fs';
import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const envPath = resolve(__dirname, '../.env');
if (existsSync(envPath)) {
  loadEnv({ path: envPath, override: true });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

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
      ? (process.env.FRONTEND_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [
          'http://localhost:3000',
          'http://localhost:3001',
        ])
      : (origin, cb) => {
          if (!origin) return cb(null, true);
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

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Backend API: http://localhost:${port}/api/v1`);
}
bootstrap();
