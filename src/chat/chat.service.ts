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
import { CreateMessageDto } from './dto/create-message-dto';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
  ) {}

  async getRooms() {
    return await this.roomsRepository.find({
      relations: {
        messages: true,
      },
    });
  }

  async getRoomById(roomId: string) {
    const room = await this.roomsRepository.findOne({
      where: { roomId: roomId },
      relations: {
        messages: true,
      },
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

    const messages = await this.getMessages(room.roomId);

    if (!room) {
      throw new ForbiddenException('Room does not exists');
    }

    return {
      room: {
        roomId: room.roomId,
        usersIds: room.usersIds,
        users: room.users,
        messages: messages,
      },
    };
  }

  async addRoom(createRoomDto: CreateRoomDto) {
    const room = new Room();
    room.roomId = uuidv4();
    room.usersIds = createRoomDto.usersIds;
    room.users = createRoomDto.users;
    room.users[0].isActive = false;
    room.users[1].isActive = false;

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
    const newMessage = await this.sendMessageToRep(createMessageDto);

    const room = await this.roomsRepository.findOne({
      where: { roomId: createMessageDto.roomId },
      relations: {
        messages: true,
      },
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

  async userJoinRoom(roomId: string, userId: number) {
    await this.setIsReadMessages(roomId, userId);

    const room = await this.roomsRepository.findOne({
      where: { roomId: roomId },
      relations: {
        messages: true,
      },
    });
    const userUpdated = room.users.filter((item) => item.id === userId)[0];
    const userOriginal = room.users.filter((item) => item.id !== userId)[0];
    userUpdated.isActive = true;
    room.users = [userUpdated, userOriginal];

    await this.roomsRepository.save(room);
    return { users: room.users, messages: room.messages };
  }

  async userLeaveRoom(roomId: string, userId: number) {
    const room = await this.roomsRepository.findOne({
      where: { roomId: roomId },
    });
    const userUpdated = room.users.filter((item) => item.id === userId)[0];
    const userOriginal = room.users.filter((item) => item.id !== userId)[0];
    userUpdated.isActive = false;
    room.users = [userUpdated, userOriginal];

    await this.roomsRepository.save(room);
    return room.users;
  }

  private async getMessages(roomId: string) {
    return await this.messagesRepository.find({
      where: {
        roomId: roomId,
      },
    });
  }

  private async sendMessageToRep(createMessageDto: CreateMessageDto) {
    const newMessage = new Message();
    newMessage.messageId = uuidv4();
    newMessage.message = createMessageDto.message;
    newMessage.roomId = createMessageDto.roomId;
    newMessage.timeSent = createMessageDto.timeSent;
    newMessage.user = createMessageDto.user;
    newMessage.isRead = createMessageDto.isRead;

    return this.messagesRepository.save(newMessage);
  }

  private async setIsReadMessages(roomId: string, userId: number) {
    const messages = await this.messagesRepository.find({
      where: {
        roomId: roomId,
      },
    });

    const messagesToUpdate = messages.reduce((accumulator, message, index) => {
      if (message.user.id !== userId) {
        message.isRead = true;
      }
      return [...accumulator, message];
    }, []);

    return await this.messagesRepository.save(messagesToUpdate);
  }
}
