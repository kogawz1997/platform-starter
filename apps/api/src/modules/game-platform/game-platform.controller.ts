import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { GamePlatformService } from './game-platform.service';
import { CreateGameProviderDto, UpdateGameProviderDto, normalizeCreateGameProviderDto, normalizeUpdateGameProviderDto } from './dto/game-provider.dto';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin')
export class GamePlatformController {
  constructor(private readonly gamePlatformService: GamePlatformService) {}

  @RequirePermission('game.providers.view')
  @Get('game-platform/overview')
  overview() {
    return this.gamePlatformService.overview();
  }

  @RequirePermission('game.providers.view')
  @Get('game-platform/data-model-plan')
  dataModelPlan() {
    return this.gamePlatformService.dataModelPlan();
  }

  @RequirePermission('game.providers.view')
  @Get('game-providers')
  listProviders() {
    return this.gamePlatformService.listProviders();
  }

  @RequirePermission('game.providers.view')
  @Get('game-providers/:id')
  getProvider(@Param('id') id: string) {
    return this.gamePlatformService.getProvider(id);
  }

  @RequirePermission('game.providers.manage')
  @Post('game-providers')
  createProvider(@Body() body: CreateGameProviderDto, @CurrentUser() user: any, @Req() req: any) {
    return this.gamePlatformService.createProvider(normalizeCreateGameProviderDto(body), user, this.meta(req));
  }

  @RequirePermission('game.providers.manage')
  @Patch('game-providers/:id')
  updateProvider(@Param('id') id: string, @Body() body: UpdateGameProviderDto, @CurrentUser() user: any, @Req() req: any) {
    return this.gamePlatformService.updateProvider(id, normalizeUpdateGameProviderDto(body), user, this.meta(req));
  }

  private meta(req: any) {
    return {
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    };
  }
}
