import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { CreateTopUpRequestDto } from './dto/create-top-up-request.dto';
import { TopUpsService } from './topups.service';

@Controller()
export class TopUpsController {
  constructor(private readonly topUpsService: TopUpsService) {}

  @UseGuards(MemberAuthGuard)
  @Post('member/topups')
  createMemberRequest(@CurrentUser() user: any, @Body() body: CreateTopUpRequestDto) {
    return this.topUpsService.createMemberRequest(user.id, body);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/topups')
  getMemberRequests(@CurrentUser() user: any) {
    return this.topUpsService.getMemberRequests(user.id);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/topups/:id')
  getMemberRequest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.topUpsService.getMemberRequest(user.id, id);
  }
}
