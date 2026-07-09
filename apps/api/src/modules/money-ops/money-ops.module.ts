import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MoneyOpsController } from './money-ops.controller';
import { MoneyOpsService } from './money-ops.service';
import { ProviderSimulatorController } from './provider-simulator.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [MoneyOpsController, ProviderSimulatorController],
  providers: [MoneyOpsService],
})
export class MoneyOpsModule {}
