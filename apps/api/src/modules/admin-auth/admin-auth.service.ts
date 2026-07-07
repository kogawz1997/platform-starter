import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AdminSignInDto } from './dto/admin-sign-in.dto';
import { VerifyAdminTwoFactorDto } from './dto/verify-admin-2fa.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(dto: AdminSignInDto, meta: RequestMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { username: dto.username } });
    if (!admin || admin.status !== 'ACTIVE') {
      await this.safeWriteLoginHistory(null, false, meta, 'ADMIN_NOT_ACTIVE');
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const valid = await argon2.verify(admin.passwordHash, dto.secret);
    if (!valid) {
      await this.safeWriteLoginHistory(admin.id, false, meta, 'INVALID_SECRET');
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (admin.twoFactorEnabled && !dto.twoFactorCode) return { requiresTwoFactor: true, challengeId: admin.id };
    if (admin.twoFactorEnabled) this.assertTotp(admin.twoFactorSecret, dto.twoFactorCode ?? '');

    await this.safeWriteLoginHistory(admin.id, true, meta);
    await this.safeWriteAudit(admin.id, 'admin.login', 'auth', admin.id, meta);
    return this.createAdminSession(admin.id, meta);
  }

  async setupTwoFactor(adminUserId: string, meta: RequestMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.status !== 'ACTIVE') throw new UnauthorizedException('Admin is not active');
    const secret = authenticator.generateSecret();
    const issuer = this.configService.get<string>('ADMIN_OTP_ISSUER') ?? 'Platform Admin';
    const otpAuthUrl = authenticator.keyuri(admin.username, issuer, secret);
    await this.prisma.adminUser.update({ where: { id: admin.id }, data: { twoFactorSecret: secret, twoFactorEnabled: false } });
    await this.safeWriteAudit(admin.id, 'admin.otp.setup', 'auth', admin.id, meta);
    return { secret, otpAuthUrl };
  }

  async enableTwoFactor(adminUserId: string, code: string, meta: RequestMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.status !== 'ACTIVE' || !admin.twoFactorSecret) throw new UnauthorizedException('Two factor setup is not ready');
    this.assertTotp(admin.twoFactorSecret, code);
    await this.prisma.adminUser.update({ where: { id: admin.id }, data: { twoFactorEnabled: true } });
    await this.safeWriteAudit(admin.id, 'admin.otp.enable', 'auth', admin.id, meta);
    return { success: true };
  }

  async verifyTwoFactor(dto: VerifyAdminTwoFactorDto, meta: RequestMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: dto.challengeId } });
    if (!admin || admin.status !== 'ACTIVE' || !admin.twoFactorEnabled) throw new UnauthorizedException('Invalid challenge');
    this.assertTotp(admin.twoFactorSecret, dto.code);
    await this.safeWriteLoginHistory(admin.id, true, meta);
    await this.safeWriteAudit(admin.id, 'admin.otp.verify', 'auth', admin.id, meta);
    return this.createAdminSession(admin.id, meta);
  }

  async refreshSession(refreshToken: string, meta: RequestMeta = {}) {
    const { sessionId, rawToken } = this.readRefreshTokenParts(refreshToken);
    const session = await this.prisma.authSession.findFirst({ where: { id: sessionId, type: 'ADMIN', revokedAt: null, expiresAt: { gt: new Date() } } });
    if (!session?.adminUserId) throw new UnauthorizedException('Invalid admin refresh session');
    const valid = await argon2.verify(session.refreshTokenHash, rawToken);
    if (!valid) throw new UnauthorizedException('Invalid admin refresh session');
    await this.prisma.authSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return this.createAdminSession(session.adminUserId, meta);
  }

  async signOut(sessionId: string, adminUserId: string, meta: RequestMeta = {}) {
    await this.prisma.authSession.updateMany({ where: { id: sessionId, type: 'ADMIN', revokedAt: null }, data: { revokedAt: new Date() } });
    await this.safeWriteAudit(adminUserId, 'admin.logout', 'auth', adminUserId, meta);
    return { success: true };
  }

  private async createAdminSession(adminUserId: string, meta: RequestMeta = {}) {
    const rawToken = randomBytes(48).toString('base64url');
    const refreshTokenHash = await argon2.hash(rawToken);
    const expiresAt = new Date(Date.now() + this.getRefreshTokenTtlMs());
    const session = await this.prisma.authSession.create({ data: { type: 'ADMIN', adminUserId, refreshTokenHash, ipAddress: meta.ipAddress, userAgent: meta.userAgent, deviceId: meta.deviceId, expiresAt } });
    const accessToken = await this.jwtService.signAsync({ sub: adminUserId, type: 'ADMIN', sessionId: session.id }, { secret: this.configService.get<string>('JWT_ACCESS_KEY') ?? 'local_access_key', expiresIn: (this.configService.get<string>('ADMIN_JWT_ACCESS_TTL') ?? '10m') as any });
    return { accessToken, refreshToken: `${session.id}.${rawToken}`, expiresAt };
  }

  private assertTotp(secret: string | null, code: string) {
    if (!secret) throw new UnauthorizedException('Two factor secret is missing');
    const normalized = String(code ?? '').replace(/\s/g, '');
    const valid = authenticator.check(normalized, secret);
    if (!valid) throw new UnauthorizedException('Invalid code');
  }

  private readRefreshTokenParts(value: string) {
    const [sessionId, rawToken] = value.split('.');
    if (!sessionId || !rawToken) throw new UnauthorizedException('Invalid refresh token');
    return { sessionId, rawToken };
  }

  private getRefreshTokenTtlMs() {
    const hours = Number(this.configService.get<string>('ADMIN_REFRESH_TTL_HOURS') ?? 12);
    return hours * 60 * 60 * 1000;
  }

  private async safeWriteLoginHistory(adminUserId: string | null, success: boolean, meta: RequestMeta, reason?: string) {
    try {
      await this.prisma.loginHistory.create({ data: { type: 'ADMIN', adminUserId, success, ipAddress: meta.ipAddress, userAgent: meta.userAgent, reason } });
    } catch (error) {
      console.error('admin login history write failed', error);
    }
  }

  private async safeWriteAudit(adminUserId: string, action: string, module: string, targetId: string, meta: RequestMeta) {
    try {
      await this.prisma.adminAuditLog.create({ data: { adminUserId, action, module, targetId, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
    } catch (error) {
      console.error('admin audit write failed', error);
    }
  }
}

export type RequestMeta = { ipAddress?: string; userAgent?: string; deviceId?: string };
