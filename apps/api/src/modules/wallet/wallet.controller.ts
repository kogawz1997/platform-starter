import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { WalletService } from './wallet.service';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(MemberAuthGuard)
  @Get('member/wallet')
  getWallet(@CurrentUser() user: any) {
    return this.walletService.getMemberWallet(user.id);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/wallet/ledger')
  getLedger(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.walletService.getMemberLedger(user.id, Number(limit ?? 50));
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/ledgers')
  getAdminLedgers(
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('direction') direction?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getAdminLedgers({ userId, type, direction, limit });
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/wallets')
  getAdminWallets(@Query('search') search?: string, @Query('limit') limit?: string) {
    return this.walletService.getAdminWallets({ search, limit });
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/wallets/:userId')
  getAdminWalletDetail(@Param('userId') userId: string) {
    return this.walletService.getAdminWalletDetail(userId);
  }
}
