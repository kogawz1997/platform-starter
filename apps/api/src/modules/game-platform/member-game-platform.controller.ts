import { Controller, Get, UseGuards } from '@nestjs/common';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { GamePlatformService } from './game-platform.service';

@UseGuards(MemberAuthGuard)
@Controller('member')
export class MemberGamePlatformController {
  constructor(private readonly gamePlatformService: GamePlatformService) {}

  @Get('games')
  listGames() {
    return this.gamePlatformService.listMemberGames();
  }
}
