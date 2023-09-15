import { Controller, Get, Param } from '@nestjs/common';
import { Room } from './interfaces/chat.interface';
import { ChatService } from './chat.service';

@Controller()
export class ChatController {
  constructor(private userService: ChatService) {}

  @Get('api/rooms')
  async getAllRooms(): Promise<Room[]> {
    return await this.userService.getRooms();
  }

  @Get('api/rooms/:room')
  async getRoom(@Param() params): Promise<Room> {
    const rooms = await this.userService.getRooms();
    const room = await this.userService.getRoomByName(params.room);
    return rooms[room];
  }
}
