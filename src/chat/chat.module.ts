import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { User } from '../users/entities/user.entity';
import { Message } from './entities/message.entity';
import { EventsGateway } from '../events/events.gateway';
import { UsersService } from '../users/users.service';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from '../iam/config/jwt.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Event, User, Message]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
  ],
  controllers: [ChatController],
  providers: [ChatService, EventsGateway, UsersService],
  exports: [ChatService],
})
export class ChatModule {}
