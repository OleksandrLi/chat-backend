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
} from '../chat/interfaces/chat.interface';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { Message } from '../chat/entities/message.entity';

// TODO
// фронт шлет запит на бек для рід меседжес - бекенд оновлює статуси повідомлень в базі - бекенд відправляє по вебсокету іншому юзеру що його повідомлення прочитані
// юзефект що слідкує за статусами повідомлень - якщо непрчоитані повідомлення, відіслати запит на ендпоінт для рід меседжів
// приклад на елітлі

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
    payload: Message,
  ): Promise<void> {
    this.server.emit('chat', payload as never);
  }

  @SubscribeMessage('read_messages')
  async handleReadMessageEvent(
    @MessageBody()
    payload: {
      roomId: string;
      messagesIds: number[];
    },
  ): Promise<void> {
    this.server.emit('read_messages', payload as never);
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
