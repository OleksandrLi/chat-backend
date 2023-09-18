import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
  ) {}

  async getRooms() {
    return await this.roomsRepository.find();
  }

  async getRoomById(roomId: string) {
    const room = await this.roomsRepository.findOne({
      where: { roomId: roomId },
      select: { roomId: true, users: true },
    });
    return { room: room };
  }

  async getRoomByUsersId(user1Id: number, user2Id: number) {
    const numbers = [+user1Id, +user2Id];
    const room = await this.roomsRepository.findOne({
      where: { users: ArrayContains(numbers) },
    });
    return { room: room };
  }

  async addRoom(createRoomDto: CreateRoomDto) {
    const room = new Room();
    room.roomId = uuidv4();
    room.users = createRoomDto.users;

    const isRoom = await this.roomsRepository.findBy({
      users: ArrayContains(createRoomDto.users),
    });
    if (isRoom.length) {
      return { room: isRoom };
    } else {
      await this.roomsRepository.save(room);
      return { room: room };
    }
  }
}
