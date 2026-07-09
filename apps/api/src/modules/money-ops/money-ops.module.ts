import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MoneyOpsController } from './money-ops.controller';
import { MoneyOpsService } from './money-ops.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MoneyOpsController],
  providers: [MoneyOpsService],
})
export class MoneyOpsModule {}
