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
} from '../chat/interfaces/chat.interface';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';

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

  private logger = new Logger('EventsGateway');

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
  //
  // @SubscribeMessage('chat')
  // async handleChatEvent(
  //   @MessageBody()
  //   payload: Message,
  // ): Promise<Message> {
  //   this.logger.log(payload);
  //   this.server.to(payload.roomId).emit('chat', payload);
  //   return payload;
  // }
  //
  // @SubscribeMessage('join_room')
  // async handleSetClientDataEvent(
  //   @MessageBody()
  //   payload: {
  //     roomId: string;
  //     userId: number;
  //     socketId: string;
  //   },
  // ) {
  //   if (payload.socketId) {
  //     await this.server.in(payload.socketId).socketsJoin(payload.roomId);
  //     const users = await this.chatService.userJoinRoom(
  //       payload.roomId,
  //       payload.userId,
  //     );
  //     this.server.to(payload.roomId).emit('join_room', users);
  //   }
  // }
  //
  // @SubscribeMessage('leave_room')
  // async handleLeaveClientDataEvent(
  //   @MessageBody()
  //   payload: {
  //     roomId: string;
  //     userId: number;
  //     socketId: string;
  //   },
  // ) {
  //   if (payload.socketId) {
  //     await this.server.in(payload.socketId).socketsLeave(payload.roomId);
  //     const users = await this.chatService.userLeaveRoom(
  //       payload.roomId,
  //       payload.userId,
  //     );
  //     this.server.to(payload.roomId).emit('leave_room', users);
  //   }
  // }

  async handleConnection(socket: Socket): Promise<void> {
    this.logger.log(`Socket connected: ${socket.id}`);
    const user = await this.usersService.setUserIsOnline(
      socket.handshake.auth.token,
      true,
    );
    await this.handleSetOnline({ userId: user.id, socketId: socket.id });
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    this.logger.log(`Socket disconnected: ${socket.id}`);
    const user = await this.usersService.setUserIsOnline(
      socket.handshake.auth.token,
      false,
    );
    await this.handleSetOffline({ userId: user.id, socketId: socket.id });
  }
}
