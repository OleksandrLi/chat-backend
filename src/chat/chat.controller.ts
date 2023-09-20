import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { IRoom } from './interfaces/chat.interface';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('rooms')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('')
  getAllRooms(): Promise<IRoom[]> {
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

  @Delete(':roomId')
  removeRoom(@Param() params) {
    return this.chatService.deleteRoom(params.roomId);
  }

  @Delete('')
  removeRooms() {
    return this.chatService.deleteRooms();
  }
}
