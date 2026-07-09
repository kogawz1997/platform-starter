import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { GameTransferActionService } from './game-transfer-action.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/game-transfers/:id/actions')
export class GameTransferActionController {
  constructor(private readonly service: GameTransferActionService) {}
  @RequirePermission('game.providers.manage') @Patch('manual-reverse') manualReverse(@Param('id') id: string, @Body() body: { note?: string }, @CurrentUser() user: any) { return this.service.manualReverse(id, user, body.note ?? 'Manual reverse'); }
  @RequirePermission('game.providers.manage') @Patch('force-fail') forceFail(@Param('id') id: string, @Body() body: { note?: string }, @CurrentUser() user: any) { return this.service.forceFail(id, user, body.note ?? 'Force failed by admin'); }
}
