import { Module } from '@nestjs/common';
import { GamePlatformController } from './game-platform.controller';
import { GamePlatformService } from './game-platform.service';

@Module({ controllers: [GamePlatformController], providers: [GamePlatformService], exports: [GamePlatformService] })
export class GamePlatformModule {}
