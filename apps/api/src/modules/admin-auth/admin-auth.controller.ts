import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminSignInDto } from './dto/admin-sign-in.dto';
import { VerifyAdminTwoFactorDto } from './dto/verify-admin-2fa.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  signIn(@Body() dto: AdminSignInDto, @Req() req: any) {
    return this.adminAuthService.signIn(dto, this.meta(req, dto.deviceId));
  }

  @Post('2fa/verify')
  verifyTwoFactor(@Body() dto: VerifyAdminTwoFactorDto, @Req() req: any) {
    return this.adminAuthService.verifyTwoFactor(dto, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('2fa/setup')
  setupTwoFactor(@CurrentUser() user: any, @Req() req: any) {
    return this.adminAuthService.setupTwoFactor(user.id, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('2fa/enable')
  enableTwoFactor(@CurrentUser() user: any, @Body('code') code: string, @Req() req: any) {
    return this.adminAuthService.enableTwoFactor(user.id, code, this.meta(req));
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string, @Req() req: any) {
    return this.adminAuthService.refreshSession(refreshToken, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('logout')
  signOut(@CurrentUser() user: any, @Req() req: any) {
    return this.adminAuthService.signOut(user.sessionId, user.id, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return user;
  }

  private meta(req: any, deviceId?: string) {
    return {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceId,
    };
  }
}
