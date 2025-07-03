import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcModule } from '@server/trpc/trpc.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DeepSeekService } from './deepseek.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TrpcModule],
  controllers: [AppController, ChatController],
  providers: [AppService, ChatService, DeepSeekService],
})
export class AppModule {}
