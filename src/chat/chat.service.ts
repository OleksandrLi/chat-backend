import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { v4 as uuidv4 } from 'uuid';
import { CreateMessageDto } from './dto/create-message-dto';
import { Message } from './entities/message.entity';
import { ActiveUserData } from '../iam/interfaces/active-user-data.interface';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  relations = {
    messages: true,
    client: true,
    provider: true,
  };

  userData = { id: true, image: true, isOnline: true, name: true };

  async getRooms(): Promise<Room[]> {
    return await this.roomsRepository.find({
      relations: this.relations,
      select: {
        client: this.userData,
        provider: this.userData,
      },
    });
  }

  async getRoomById(roomId: string): Promise<{ room: Room }> {
    const room = await this.roomsRepository.findOne({
      where: { roomId: roomId },
      relations: this.relations,
      select: {
        client: this.userData,
        provider: this.userData,
      },
    });

    if (!room) {
      throw new NotFoundException('Room does not exists');
    }
    return {
      room,
    };
  }

  async getRoomByUserId(
    userId: number,
    activeUserId: number,
  ): Promise<{ room: Room }> {
    const room = await this.getRoom(userId, activeUserId);

    if (!room) {
      throw new NotFoundException('Room does not exists');
    }
    return {
      room: room[0],
    };
  }

  async getRoomByActiveUser(user: ActiveUserData): Promise<{ rooms: Room[] }> {
    const clientRooms = await this.roomsRepository.find({
      where: { client: { id: user.sub } },
      relations: this.relations,
    });

    const providerRooms = await this.roomsRepository.find({
      where: { provider: { id: user.sub } },
      relations: this.relations,
    });

    return { rooms: [...clientRooms, ...providerRooms] };
  }

  async addRoom(
    createRoomDto: CreateRoomDto,
    user: ActiveUserData,
  ): Promise<{ room: Room[] } | { room: Room }> {
    const client = await this.usersRepository.findOne({
      where: { id: user.sub },
    });
    const provider = await this.usersRepository.findOne({
      where: { id: createRoomDto.providerId },
    });

    const room = new Room();
    room.roomId = uuidv4();
    room.client = client;
    room.provider = provider;

    const isRoom = await this.getRoom(createRoomDto.providerId, user.sub);

    if (isRoom) {
      return { room: isRoom };
    } else {
      await this.roomsRepository.save(room);
      return { room };
    }
  }

  // TODO з фронта відправку повідомлення по сокету вставити в цей ендпоінт на відправку повідомлення
  // TODO змінити any коли виправлю
  async sendMessage(createMessageDto: CreateMessageDto): Promise<any> {
    const newMessage = await this.sendMessageToRep(createMessageDto);

    // const room = await this.roomsRepository.findOne({
    //   where: { roomId: createMessageDto.roomId },
    //   relations: {
    //     messages: true,
    //   },
    // });
    // const updatedRoom = await this.roomsRepository.preload({
    //   id: room.id,
    //   usersIds: room.usersIds,
    //   users: room.users,
    //   messages: [...room.messages, newMessage],
    // });
    // if (!updatedRoom) {
    //   throw new NotFoundException(`This chat was not found`);
    // }
    // return this.roomsRepository.save(updatedRoom);
  }

  async deleteRoom(roomId: string): Promise<Room> {
    const room = await this.roomsRepository.findOne({
      where: { roomId: roomId },
    });
    return this.roomsRepository.remove(room);
  }

  async deleteRooms(): Promise<void> {
    return this.roomsRepository.clear();
  }

  // TODO змінити any коли виправлю
  async userJoinRoom(roomId: string, userId: number): Promise<any> {
    await this.setIsReadMessages(roomId, userId);
    //
    //   const room = await this.roomsRepository.findOne({
    //     where: { roomId: roomId },
    //     relations: {
    //       messages: true,
    //     },
    //   });
    //   const userUpdated = room.users.filter((item) => item.id === userId)[0];
    //   const userOriginal = room.users.filter((item) => item.id !== userId)[0];
    //   userUpdated.isActive = true;
    //   room.users = [userUpdated, userOriginal];
    //
    //   await this.roomsRepository.save(room);
    //   return { users: room.users, messages: room.messages };
    // }
    //
    // async userLeaveRoom(roomId: string, userId: number): Promise<any> {
    //   const room = await this.roomsRepository.findOne({
    //     where: { roomId: roomId },
    //   });
    //   const userUpdated = room.users.filter((item) => item.id === userId)[0];
    //   const userOriginal = room.users.filter((item) => item.id !== userId)[0];
    //   userUpdated.isActive = false;
    //   room.users = [userUpdated, userOriginal];
    //
    //   await this.roomsRepository.save(room);
    //   return room.users;
    // }
    //
    // private async getMessages(roomId: string): Promise<Message[]> {
    //   return await this.messagesRepository.find({
    //     where: {
    //       roomId: roomId,
    //     },
    //   });
  }

  private async sendMessageToRep(
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const newMessage = createMessageDto as Message;
    newMessage.messageId = uuidv4();

    return this.messagesRepository.save(newMessage);
  }

  private async setIsReadMessages(
    roomId: string,
    userId: number,
  ): Promise<any[]> {
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

  private async getRoom(
    userId: number,
    activeUserId: number,
  ): Promise<Room[] | null> {
    const clientRoom = await this.roomsRepository.findOne({
      where: { client: { id: activeUserId }, provider: { id: userId } },
      relations: this.relations,
    });

    const providerRoom = await this.roomsRepository.findOne({
      where: { client: { id: userId }, provider: { id: activeUserId } },
      relations: this.relations,
    });

    const room = [];
    if (clientRoom) {
      room.push(clientRoom);
    }
    if (providerRoom) {
      room.push(providerRoom);
    }

    return room.length ? room : null;
  }
}
