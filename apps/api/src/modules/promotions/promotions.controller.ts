import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { PromotionsService } from './promotions.service';

@Controller()
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get('public/promotions')
  listPublicCampaigns() {
    return this.promotions.listPublicCampaigns();
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/promotion-claims')
  listMemberClaims(@CurrentUser() user: any) {
    return this.promotions.listMemberClaims(user);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/promotion-claims')
  createClaim(@CurrentUser() user: any, @Body() body: any) {
    return this.promotions.createClaim(user, body);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/bonus-ledgers')
  listMemberBonusLedgers(@CurrentUser() user: any) {
    return this.promotions.listMemberBonusLedgers(user);
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/promotion-claims')
  listAdminClaims(@Query('status') status?: string) {
    return this.promotions.listAdminClaims({ status });
  }

  @UseGuards(AdminAuthGuard)
  @Patch('admin/promotion-claims/:id/review')
  reviewClaim(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.promotions.reviewClaim(user, id, body);
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/bonus-ledgers')
  listAdminBonusLedgers(@Query('status') status?: string) {
    return this.promotions.listAdminBonusLedgers({ status });
  }

  @UseGuards(AdminAuthGuard)
  @Patch('admin/bonus-ledgers/:id/turnover-progress')
  addTurnoverProgress(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.promotions.addTurnoverProgress(user, id, body);
  }
}
