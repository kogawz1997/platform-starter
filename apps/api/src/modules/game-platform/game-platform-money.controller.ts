import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateGameTransferDto, normalizeTransferAmount } from './dto/game-transfer.dto';
import { GamePlatformMoneyService } from './game-platform-money.service';

@UseGuards(MemberAuthGuard)
@Controller('member')
export class MemberGameTransferController {
  constructor(private readonly moneyService: GamePlatformMoneyService) {}

  @Post('game-sessions/:sessionId/transfer-in')
  transferIn(@Param('sessionId') sessionId: string, @Body() body: CreateGameTransferDto, @CurrentUser() user: any, @Req() req: any) {
    return this.moneyService.transferDryRun(sessionId, user, 'TRANSFER_IN', normalizeTransferAmount(body), this.meta(req));
  }

  @Post('game-sessions/:sessionId/transfer-out')
  transferOut(@Param('sessionId') sessionId: string, @Body() body: CreateGameTransferDto, @CurrentUser() user: any, @Req() req: any) {
    return this.moneyService.transferDryRun(sessionId, user, 'TRANSFER_OUT', normalizeTransferAmount(body), this.meta(req));
  }

  private meta(req: any) { return { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] }; }
}

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin')
export class AdminGameMoneyController {
  constructor(private readonly moneyService: GamePlatformMoneyService) {}

  @RequirePermission('game.providers.view')
  @Get('game-transfers')
  listTransfers() { return this.moneyService.listTransfers(); }

  @RequirePermission('game.providers.view')
  @Get('game-transfers/:id')
  getTransfer(@Param('id') id: string) { return this.moneyService.getTransfer(id); }

  @RequirePermission('game.providers.view')
  @Get('webhook-logs')
  listWebhookLogs() { return this.moneyService.listWebhookLogs(); }

  @RequirePermission('game.providers.view')
  @Get('webhook-logs/:id')
  getWebhookLog(@Param('id') id: string) { return this.moneyService.getWebhookLog(id); }
}

@Controller('provider-webhooks')
export class ProviderWebhookController {
  constructor(private readonly moneyService: GamePlatformMoneyService) {}

  @Post(':providerCode')
  receive(@Param('providerCode') providerCode: string, @Headers() headers: Record<string, string | string[] | undefined>, @Body() body: unknown) {
    return this.moneyService.receiveWebhook(providerCode, headers, body);
  }
}
