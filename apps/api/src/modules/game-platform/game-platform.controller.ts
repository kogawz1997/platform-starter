import { Controller, Get } from '@nestjs/common';
import { GamePlatformService } from './game-platform.service';

@Controller('admin/game-platform')
export class GamePlatformController {
  constructor(private readonly gamePlatformService: GamePlatformService) {}

  @Get('overview')
  overview() {
    return this.gamePlatformService.overview();
  }

  @Get('data-model-plan')
  dataModelPlan() {
    return this.gamePlatformService.dataModelPlan();
  }
}
