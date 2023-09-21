import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from './interfaces/chat.interface';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { User } from '../users/entities/user.entity';
import { Message } from './entities/message.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private userService: ChatService) {}

  @WebSocketServer() server: Server = new Server<
    ServerToClientEvents,
    ClientToServerEvents
  >();

  private logger = new Logger('ChatGateway');

  @SubscribeMessage('chat')
  async handleChatEvent(
    @MessageBody()
    payload: Message,
  ): Promise<Message> {
    this.logger.log(payload);
    this.server.to(payload.roomId).emit('chat', payload); // broadcast messages
    return payload;
  }

  @SubscribeMessage('join_room')
  async handleSetClientDataEvent(
    @MessageBody()
    payload: {
      roomId: string;
      user: User;
      socketId: string;
    },
  ) {
    if (payload.socketId) {
      this.logger.log(
        `${payload.socketId} ${payload.user.name} is joining ${payload.roomId}`,
      );
      await this.server.in(payload.socketId).socketsJoin(payload.roomId);
    }
  }

  async handleConnection(socket: Socket): Promise<void> {
    this.logger.log(`Socket connected: ${socket.id}`);
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    this.logger.log(`Socket disconnected: ${socket.id}`);
  }
}
