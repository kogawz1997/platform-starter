import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { MoneyOpsController } from './money-ops.controller';
import { MoneyOpsService } from './money-ops.service';
import { ProviderSimulatorController } from './provider-simulator.controller';
import { WalletLedgerDetailController } from './wallet-ledger-detail.controller';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [MoneyOpsController, ProviderSimulatorController, WalletLedgerDetailController],
  providers: [MoneyOpsService],
})
export class MoneyOpsModule {}
