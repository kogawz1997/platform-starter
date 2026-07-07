import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { QueuesController } from '../queues/queues.controller';
import { QueuesService } from '../queues/queues.service';
import { OperationsController } from '../activity/operations.controller';
import { ActivityService } from '../activity/activity.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [FinanceController, QueuesController, OperationsController],
  providers: [FinanceService, QueuesService, ActivityService],
})
export class FinanceModule {}
