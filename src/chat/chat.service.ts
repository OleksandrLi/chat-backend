import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { CreateMessageDto } from './dto/create-message-dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getRooms() {
    return await this.roomsRepository.find();
  }

  async getRoomById(roomId: string) {
    const room = await this.roomsRepository.findOne({
      where: { roomId: roomId },
      select: { roomId: true, usersIds: true, users: true, messages: true },
    });

    if (!room) {
      throw new ForbiddenException('Room does not exists');
    }

    return {
      room: {
        roomId: room.roomId,
        usersIds: room.usersIds,
        users: room.users,
        messages: room.messages,
      },
    };
  }

  async getRoomByUsersId(user1Id: number, user2Id: number) {
    const numbers = [+user1Id, +user2Id];
    const room = await this.roomsRepository.findOne({
      where: { usersIds: ArrayContains(numbers) },
    });

    if (!room) {
      throw new ForbiddenException('Room does not exists');
    }

    return {
      room: {
        roomId: room.roomId,
        usersIds: room.usersIds,
        users: room.users,
        messages: room.messages,
      },
    };
  }

  async addRoom(createRoomDto: CreateRoomDto) {
    const room = new Room();
    room.roomId = uuidv4();
    room.usersIds = createRoomDto.usersIds;
    room.users = createRoomDto.users;

    const isRoom = await this.roomsRepository.findBy({
      usersIds: ArrayContains(createRoomDto.usersIds),
    });
    if (isRoom.length) {
      return { room: isRoom };
    } else {
      await this.roomsRepository.save(room);
      return { room: room };
    }
  }

  async sendMessage(createMessageDto: CreateMessageDto) {
    const newMessage = createMessageDto;
    newMessage.messageId = uuidv4();

    const room = await this.roomsRepository.findOne({
      where: { roomId: createMessageDto.roomId },
    });
    const updatedRoom = await this.roomsRepository.preload({
      id: room.id,
      usersIds: room.usersIds,
      users: room.users,
      messages: [...room.messages, newMessage],
    });
    if (!updatedRoom) {
      throw new NotFoundException(`This chat was not found`);
    }
    return this.roomsRepository.save(updatedRoom);
  }

  async deleteRoom(roomId: string) {
    const room = await this.roomsRepository.findOne({
      where: { roomId: roomId },
    });
    return this.roomsRepository.remove(room);
  }

  async deleteRooms() {
    return this.roomsRepository.clear();
  }
}
