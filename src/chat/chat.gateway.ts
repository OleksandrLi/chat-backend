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
import { Message } from './entities/message.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private userService: ChatService,
    private chatService: ChatService,
  ) {}

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
    this.server.to(payload.roomId).emit('chat', payload);
    return payload;
  }

  @SubscribeMessage('join_room')
  async handleSetClientDataEvent(
    @MessageBody()
    payload: {
      roomId: string;
      userId: number;
      socketId: string;
    },
  ) {
    if (payload.socketId) {
      await this.server.in(payload.socketId).socketsJoin(payload.roomId);
      const users = await this.chatService.userJoinRoom(
        payload.roomId,
        payload.userId,
      );
      this.server.to(payload.roomId).emit('join_room', users);
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveClientDataEvent(
    @MessageBody()
    payload: {
      roomId: string;
      userId: number;
      socketId: string;
    },
  ) {
    if (payload.socketId) {
      await this.server.in(payload.socketId).socketsLeave(payload.roomId);
      const users = await this.chatService.userLeaveRoom(
        payload.roomId,
        payload.userId,
      );
      this.server.to(payload.roomId).emit('leave_room', users);
    }
  }

  async handleConnection(socket: Socket): Promise<void> {
    this.logger.log(`Socket connected: ${socket.id}`);
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    this.logger.log(`Socket disconnected: ${socket.id}`);
  }
}
