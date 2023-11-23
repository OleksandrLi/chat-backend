import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateMessageDto } from './dto/create-message-dto';
import { ActiveUser } from '../iam/decorators/active-user-decorator';
import { ActiveUserData } from '../iam/interfaces/active-user-data.interface';
import { Room } from './entities/room.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Message } from './entities/message.entity';

@Controller('rooms')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('')
  getAllRooms(): Promise<Room[]> {
    return this.chatService.getRooms();
  }

  @Get('active-room/:roomId')
  getRoom(@Param() params): Promise<{ room: Room }> {
    return this.chatService.getRoomById(params.roomId);
  }

  @Get('active-room/:roomId/messages')
  getMessages(
    @Param() params,
    @Query() paginationQuery,
  ): Promise<{ total: number; messages: Message[] }> {
    const { limit, offset } = paginationQuery;
    return this.chatService.getMessages(params.roomId, limit, offset);
  }

  @Get('user/:userId')
  getRoomByUserId(
    @Param() params,
    @ActiveUser() user: ActiveUserData,
  ): Promise<{ room: Room }> {
    return this.chatService.getRoomByUserId(params.userId, user.sub);
  }

  @Get('active-user-room')
  getRoomByActiveUser(
    @Query() chatsQuery,
    @ActiveUser() user: ActiveUserData,
  ): Promise<{ rooms: Room[] }> {
    const { search } = chatsQuery;
    return this.chatService.getRoomByActiveUser(user, search);
  }

  @Post('')
  addRoom(
    @Body() createRoomDto: CreateRoomDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<{ room: Room[] } | { room: Room }> {
    return this.chatService.addRoom(createRoomDto, user);
  }

  @Patch('send-message')
  @UseInterceptors(FilesInterceptor('files'))
  sendMessage(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createMessageDto: CreateMessageDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.chatService.sendMessage(files, createMessageDto, user);
  }

  @Patch(':roomId/read-messages')
  readMessages(
    @Param() params,
    @ActiveUser() user: ActiveUserData,
  ): Promise<void> {
    return this.chatService.readMessages(params.roomId, user.sub);
  }

  @Delete(':roomId')
  removeRoom(@Param() params): Promise<Room> {
    return this.chatService.deleteRoom(params.roomId);
  }

  @Delete('')
  removeRooms(): Promise<void> {
    return this.chatService.deleteRooms();
  }
}
