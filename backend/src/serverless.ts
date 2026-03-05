import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

const server = express();
let cachedApp: any;

function findSeedDb(): string | null {
  const candidates = [
    join(__dirname, 'prisma', 'dev.db'),
    join(__dirname, '..', 'prisma', 'dev.db'),
    join(__dirname, '..', '..', 'prisma', 'dev.db'),
    join(process.cwd(), 'prisma', 'dev.db'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

async function bootstrap() {
  if (cachedApp) return cachedApp;

  // Set default env vars for serverless
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'vercel-demo-secret-key-2026';
  if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'vercel-demo-refresh-secret-2026';
  if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

  // Setup SQLite in /tmp (writable in serverless)
  const runtimeDb = '/tmp/dev.db';

  if (!existsSync(runtimeDb)) {
    const seedDb = findSeedDb();
    if (seedDb) {
      copyFileSync(seedDb, runtimeDb);
    }
  }
  process.env.DATABASE_URL = `file:${runtimeDb}`;

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');
  await app.init();

  cachedApp = server;
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  const app = await bootstrap();
  app(req, res);
}
