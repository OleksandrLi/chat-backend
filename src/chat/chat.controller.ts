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

@Controller('rooms')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('')
  getAllRooms() {
    return this.chatService.getRooms();
  }

  @Get('roomId=:roomId')
  getRoom(@Param() params) {
    return this.chatService.getRoomById(params.roomId);
  }

  @Get(':user1Id/:user2Id')
  getRoomByUsersId(@Param() params) {
    return this.chatService.getRoomByUsersId(params.user1Id, params.user2Id);
  }

  @Post('')
  addRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.chatService.addRoom(createRoomDto);
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
