import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from './interfaces/chat.interface';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { Message } from '../chat/entities/message.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly usersService: UsersService) {}

  @WebSocketServer() server: Server = new Server<
    ServerToClientEvents,
    ClientToServerEvents
  >();

  @SubscribeMessage('online')
  async handleSetOnline(
    @MessageBody()
    payload: {
      userId: number;
      socketId: string;
    },
  ): Promise<void> {
    await this.server.in(payload.socketId).socketsJoin(`${payload.userId}`);
    this.server.emit('online', { userId: payload.userId } as never);
  }

  @SubscribeMessage('offline')
  async handleSetOffline(
    @MessageBody()
    payload: {
      userId: number;
      socketId: string;
    },
  ): Promise<void> {
    await this.server.in(payload.socketId).socketsLeave(`${payload.userId}`);
    this.server.emit('offline', { userId: payload.userId } as never);
  }

  @SubscribeMessage('chat')
  async handleChatEvent(
    @MessageBody()
    payload: Message[],
  ): Promise<void> {
    this.server.emit('chat', payload as never);
  }

  @SubscribeMessage('read_messages')
  async handleReadMessageEvent(
    @MessageBody()
    payload: {
      roomId: string;
      newMessages: any;
    },
  ): Promise<void> {
    this.server.emit('read_messages', payload as never);
  }

  @SubscribeMessage('typing')
  async handleSetIsTyping(
    @MessageBody()
    payload: {
      user_id: number;
      chat_id: string;
      is_typing: boolean;
    },
  ): Promise<void> {
    this.server.emit('chat_typing', payload as never);
  }

  async handleConnection(socket: Socket): Promise<void> {
    const user = await this.usersService.setUserIsOnline(
      socket.handshake.auth.token,
      true,
    );
    await this.handleSetOnline({ userId: user.id, socketId: socket.id });
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const user = await this.usersService.setUserIsOnline(
      socket.handshake.auth.token,
      false,
    );
    await this.handleSetOffline({ userId: user.id, socketId: socket.id });
  }
}
