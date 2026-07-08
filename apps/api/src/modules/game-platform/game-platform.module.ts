import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { ProviderAdapterRegistry } from './adapters/provider-adapter.registry';
import { GamePlatformController } from './game-platform.controller';
import { GamePlatformService } from './game-platform.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [GamePlatformController],
  providers: [GamePlatformService, ProviderAdapterRegistry],
  exports: [GamePlatformService, ProviderAdapterRegistry],
})
export class GamePlatformModule {}
