import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: [
      config.get<string>('MEMBER_WEB_URL') ?? 'http://localhost:3000',
      config.get<string>('ADMIN_WEB_URL') ?? 'http://localhost:3001',
    ],
    credentials: true,
  });

  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use((req: any, res: any, next: any) => {
    const limit = getRateLimit(req.method, req.path ?? req.url ?? '');
    if (!limit) return next();

    const now = Date.now();
    const ip = getClientIp(req);
    const key = `${req.method}:${req.path ?? req.url}:${ip}`;
    const bucket = rateBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + limit.windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count <= limit.max) return next();

    res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    return res.status(429).json({ message: 'Too many requests' });
  });

  app.use((req: any, res: any, next: any) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startedAt;
      const path = String(req.originalUrl ?? req.url ?? '').replace(/token=[^&]+/gi, 'token=[redacted]');
      console.log(`${req.method} ${path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? config.get<string>('API_PORT') ?? 4000);
  await app.listen(port, '0.0.0.0');
}

function getRateLimit(method: string, path: string): { max: number; windowMs: number } | null {
  const verb = String(method).toUpperCase();
  const normalizedPath = String(path).split('?')[0];
  const rules = [
    { method: 'POST', path: '/auth/login', max: 10 },
    { method: 'POST', path: '/auth/register', max: 8 },
    { method: 'POST', path: '/admin/auth/login', max: 10 },
    { method: 'POST', path: '/member/topups', max: 20 },
    { method: 'POST', path: '/member/topups/slip', max: 12 },
    { method: 'POST', path: '/member/withdrawals', max: 12 },
  ];
  const matched = rules.find((rule) => verb === rule.method && normalizedPath.startsWith(rule.path));
  if (!matched) return null;
  return { max: Number(process.env.RATE_LIMIT_PER_MINUTE ?? matched.max), windowMs: 60_000 };
}

function getClientIp(req: any) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
  return String(req.ip ?? req.socket?.remoteAddress ?? 'unknown');
}

bootstrap();
