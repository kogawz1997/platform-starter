import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { ProviderAdapterRegistry } from './adapters/provider-adapter.registry';
import { GamePlatformController } from './game-platform.controller';
import { AdminGameMoneyController, MemberGameTransferController, ProviderWebhookController } from './game-platform-money.controller';
import { GamePlatformMoneyService } from './game-platform-money.service';
import { GamePlatformService } from './game-platform.service';
import { MemberGamePlatformController } from './member-game-platform.controller';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [GamePlatformController, MemberGamePlatformController, MemberGameTransferController, AdminGameMoneyController, ProviderWebhookController],
  providers: [GamePlatformService, GamePlatformMoneyService, ProviderAdapterRegistry],
  exports: [GamePlatformService, GamePlatformMoneyService, ProviderAdapterRegistry],
})
export class GamePlatformModule {}
