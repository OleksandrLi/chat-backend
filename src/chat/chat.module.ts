import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Event])],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
