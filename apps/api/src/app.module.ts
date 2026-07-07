import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { AuthModule } from './modules/auth/auth.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TopUpsModule } from './modules/topups/topups.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ExportsModule } from './modules/exports/exports.module';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    AdminAuthModule,
    UsersModule,
    SettingsModule,
    WalletModule,
    TopUpsModule,
    WithdrawalsModule,
    FinanceModule,
    ReportsModule,
    ExportsModule,
    BankAccountsModule,
  ],
})
export class AppModule {}
