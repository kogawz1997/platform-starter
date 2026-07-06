import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { WalletService } from './wallet.service';

@UseGuards(MemberAuthGuard)
@Controller('member/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@CurrentUser() user: any) {
    return this.walletService.getMemberWallet(user.id);
  }

  @Get('ledger')
  getLedger(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.walletService.getMemberLedger(user.id, Number(limit ?? 50));
  }
}
