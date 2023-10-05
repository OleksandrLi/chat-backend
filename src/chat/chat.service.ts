import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { v4 as uuidv4 } from 'uuid';
import { CreateMessageDto } from './dto/create-message-dto';
import { Message } from './entities/message.entity';
import { ActiveUserData } from '../iam/interfaces/active-user-data.interface';
import { User } from '../users/entities/user.entity';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  relations = {
    messages: { user: true },
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
      order: { messages: { id: 'ASC' } },
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

  async sendMessage(
    createMessageDto: CreateMessageDto[],
    user: ActiveUserData,
  ): Promise<Message[]> {
    const newMessages = await this.sendMessageToRep(createMessageDto, user);

    const room = await this.roomsRepository.findOne({
      where: { roomId: createMessageDto[0].roomId },
      relations: this.relations,
    });
    const updatedRoom = await this.roomsRepository.preload({
      id: room.id,
      ...room,
      messages: [...room.messages, ...newMessages],
    });
    if (!updatedRoom) {
      throw new NotFoundException(`This chat was not found`);
    }
    await this.roomsRepository.save(updatedRoom);
    await this.eventsGateway.handleChatEvent(newMessages);
    return newMessages;
  }

  async readMessages(roomId: string, activeUserId: number): Promise<void> {
    const messages = await this.messagesRepository.find({
      where: {
        roomId: roomId,
        user: { id: Not(activeUserId) },
        isRead: IsNull(),
      },
    });
    const messagesIds = messages.map((message) => {
      return message.id;
    });

    await this.eventsGateway.handleReadMessageEvent({ roomId, messagesIds });
    await this.messagesRepository.update(
      { roomId: roomId, user: { id: Not(activeUserId) }, isRead: IsNull() },
      { isRead: true },
    );
  }

  private async sendMessageToRep(
    createMessageDto: CreateMessageDto[],
    user: ActiveUserData,
  ): Promise<Message[]> {
    const authorUser = await this.usersRepository.findOne({
      where: { id: user.sub },
    });

    const newData = createMessageDto.map((messageDto) => {
      const newMessage = new Message();
      newMessage.timeSent = new Date(Date.now());
      newMessage.message = messageDto.message;
      newMessage.user = authorUser;
      newMessage.roomId = messageDto.roomId;

      this.messagesRepository.save(newMessage);
      return newMessage;
    });

    return newData;
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

  async deleteRoom(roomId: string): Promise<Room> {
    const room = await this.roomsRepository.findOne({
      where: { roomId: roomId },
    });
    return this.roomsRepository.remove(room);
  }

  async deleteRooms(): Promise<void> {
    return this.roomsRepository.clear();
  }
}
