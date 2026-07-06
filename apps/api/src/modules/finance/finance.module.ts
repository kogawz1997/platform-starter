import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
