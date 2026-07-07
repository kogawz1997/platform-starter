import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

type RateBucket = { count: number; resetAt: number };
type RateRule = { method: string; path: string; max: number; env?: string };

const rateBuckets = new Map<string, RateBucket>();
const RATE_RULES: RateRule[] = [
  { method: 'POST', path: '/auth/login', max: 10, env: 'RATE_LIMIT_MEMBER_LOGIN_PER_MINUTE' },
  { method: 'POST', path: '/auth/register', max: 8, env: 'RATE_LIMIT_MEMBER_REGISTER_PER_MINUTE' },
  { method: 'POST', path: '/admin/auth/login', max: 10, env: 'RATE_LIMIT_ADMIN_LOGIN_PER_MINUTE' },
  { method: 'POST', path: '/member/topups', max: 20, env: 'RATE_LIMIT_TOPUPS_PER_MINUTE' },
  { method: 'POST', path: '/member/topups/slip', max: 12, env: 'RATE_LIMIT_SLIP_UPLOAD_PER_MINUTE' },
  { method: 'POST', path: '/member/withdrawals', max: 12, env: 'RATE_LIMIT_WITHDRAWALS_PER_MINUTE' },
];

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
    const requestId = String(req.headers?.['x-request-id'] ?? randomUUID());
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  app.useGlobalFilters(new HttpExceptionFilter());

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
    cleanupExpiredBuckets(now);

    const ip = getClientIp(req);
    const path = String(req.path ?? req.url ?? '').split('?')[0];
    const key = `${req.method}:${path}:${ip}`;
    const bucket = rateBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + limit.windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count <= limit.max) return next();

    res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    return res.status(429).json({ message: 'Too many requests', requestId: req.requestId });
  });

  app.use((req: any, res: any, next: any) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startedAt;
      console.log(JSON.stringify({
        level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
        event: 'http_request',
        requestId: req.requestId,
        method: req.method,
        path: redactUrl(req.originalUrl ?? req.url ?? ''),
        statusCode: res.statusCode,
        durationMs: duration,
        ip: getClientIp(req),
        userAgent: req.headers?.['user-agent'] ?? null,
      }));
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
  const matched = RATE_RULES.find((rule) => verb === rule.method && normalizedPath.startsWith(rule.path));
  if (!matched) return null;
  const envValue = matched.env ? process.env[matched.env] : undefined;
  const max = Number(envValue ?? process.env.RATE_LIMIT_PER_MINUTE ?? matched.max);
  return { max: Number.isFinite(max) && max > 0 ? max : matched.max, windowMs: 60_000 };
}

function cleanupExpiredBuckets(now: number) {
  if (rateBuckets.size < 1000) return;
  for (const [key, bucket] of rateBuckets.entries()) {
    if (bucket.resetAt <= now) rateBuckets.delete(key);
  }
}

function redactUrl(value: string) {
  return String(value)
    .replace(/token=[^&]+/gi, 'token=[redacted]')
    .replace(/refreshToken=[^&]+/gi, 'refreshToken=[redacted]')
    .replace(/accessToken=[^&]+/gi, 'accessToken=[redacted]')
    .replace(/secret=[^&]+/gi, 'secret=[redacted]')
    .replace(/password=[^&]+/gi, 'password=[redacted]');
}

function getClientIp(req: any) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
  return String(req.ip ?? req.socket?.remoteAddress ?? 'unknown');
}

bootstrap();
