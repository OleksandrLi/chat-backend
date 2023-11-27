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
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RoomsQueryDto } from './dto/rooms-query.dto';
import { MessagesPaginationQueryDto } from './dto/messages-pagination-query.dto';
import { GetRoomDto } from './dto/get-room.dto';

@ApiTags('Chats and messages')
@Controller('rooms')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('active-user-room')
  @ApiOkResponse({
    description: 'Get chats for active user',
    type: Room,
    isArray: true,
  })
  getRoomByActiveUser(
    @Query() chatsQuery: RoomsQueryDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<{ rooms: Room[] }> {
    const { search } = chatsQuery;
    return this.chatService.getRoomByActiveUser(user, search);
  }

  @Get('active-room/:roomId')
  @ApiOkResponse({
    description: 'Get chat by its id',
    type: Room,
  })
  getRoom(@Param() params): Promise<{ room: Room }> {
    return this.chatService.getRoomById(params.roomId);
  }

  @Get('active-room/:roomId/messages')
  @ApiOkResponse({
    description: 'Get messages of chat by chat id',
    type: Message,
    isArray: true,
  })
  getMessages(
    @Param() params: GetRoomDto,
    @Query() paginationQuery: MessagesPaginationQueryDto,
  ): Promise<{ total: number; messages: Message[] }> {
    const { limit, offset } = paginationQuery;
    return this.chatService.getMessages(params.roomId, limit, offset);
  }

  @ApiOkResponse({
    description: 'Create chat room with user by his id',
    type: Room,
  })
  @Post('')
  addRoom(
    @Body() createRoomDto: CreateRoomDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<{ room: Room[] } | { room: Room }> {
    return this.chatService.addRoom(createRoomDto, user);
  }

  @Patch('send-message')
  @ApiOkResponse({
    description: 'Send message to chat',
  })
  @ApiBody({
    type: CreateMessageDto,
  })
  @UseInterceptors(FilesInterceptor('files'))
  sendMessage(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createMessageDto: CreateMessageDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Message[]> {
    return this.chatService.sendMessage(files, createMessageDto, user);
  }

  @Patch(':roomId/read-messages')
  @ApiOkResponse({
    description: 'Make messages read of other user in chat by active user',
  })
  readMessages(
    @Param() params: GetRoomDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<void> {
    return this.chatService.readMessages(params.roomId, user.sub);
  }

  @Get('')
  @ApiOkResponse({
    description: 'Get all chats',
    type: Room,
    isArray: true,
  })
  getAllRooms(): Promise<Room[]> {
    return this.chatService.getRooms();
  }

  @Delete(':roomId')
  @ApiOkResponse({
    description: 'Delete chat by its id',
  })
  removeRoom(@Param() params): Promise<Room> {
    return this.chatService.deleteRoom(params.roomId);
  }

  @Delete('')
  @ApiOkResponse({
    description: 'Delete all chats',
  })
  removeRooms(): Promise<void> {
    return this.chatService.deleteRooms();
  }

  @Get('user/:userId')
  getRoomByUserId(
    @Param() params,
    @ActiveUser() user: ActiveUserData,
  ): Promise<{ room: Room }> {
    return this.chatService.getRoomByUserId(params.userId, user.sub);
  }
}
