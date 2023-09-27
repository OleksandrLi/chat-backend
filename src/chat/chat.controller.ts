import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateMessageDto } from './dto/create-message-dto';
import { ActiveUser } from '../iam/decorators/active-user-decorator';
import { ActiveUserData } from '../iam/interfaces/active-user-data.interface';

@Controller('rooms')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('')
  getAllRooms() {
    return this.chatService.getRooms();
  }

  @Get('active-room/:roomId')
  getRoom(@Param() params) {
    return this.chatService.getRoomById(params.roomId);
  }

  @Get('user/:userId')
  getRoomByUserId(@Param() params, @ActiveUser() user: ActiveUserData) {
    return this.chatService.getRoomByUserId(params.userId, user.sub);
  }

  @Get('active-user-room')
  getRoomByActiveUser(@ActiveUser() user: ActiveUserData) {
    return this.chatService.getRoomByActiveUser(user);
  }

  @Post('')
  addRoom(
    @Body() createRoomDto: CreateRoomDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.chatService.addRoom(createRoomDto, user);
  }

  @Patch('send-message')
  sendMessage(@Body() createMessageDto: CreateMessageDto) {
    return this.chatService.sendMessage(createMessageDto);
  }

  @Delete(':roomId')
  removeRoom(@Param() params) {
    return this.chatService.deleteRoom(params.roomId);
  }

  @Delete('')
  removeRooms() {
    return this.chatService.deleteRooms();
  }
}
