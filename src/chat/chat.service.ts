import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Like, Not, Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { v4 as uuidv4 } from 'uuid';
import { CreateMessageDto } from './dto/create-message-dto';
import { Message } from './entities/message.entity';
import { ActiveUserData } from '../iam/interfaces/active-user-data.interface';
import { User } from '../users/entities/user.entity';
import { EventsGateway } from '../events/events.gateway';
import { extname } from 'path';
import * as AWS from 'aws-sdk';

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

  AWS_S3_BUCKET = process.env.AWS_S3_BUCKET_NAME;
  AWS_S3_BUCKET_LOCATION = process.env.AWS_S3_BUCKET_LOCATION;
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_ACCESS_KEY,
  });

  async getRooms(): Promise<Room[]> {
    return await this.roomsRepository.find({
      relations: { ...this.relations, messages: false },
      select: {
        client: this.userData,
        provider: this.userData,
      },
    });
  }

  async getRoomById(roomId: string): Promise<{ room: Room }> {
    const room = await this.roomsRepository.findOne({
      where: { roomId: roomId },
      relations: { ...this.relations, messages: false },
      select: {
        client: this.userData,
        provider: this.userData,
        messages: false,
      },
    });

    if (!room) {
      throw new NotFoundException('Room does not exists');
    }
    return {
      room,
    };
  }

  async getMessages(
    roomId: string,
    limit: string,
    offset: string,
  ): Promise<{ total: number; messages: Message[] }> {
    const [messages, total] = await this.messagesRepository.findAndCount({
      where: {
        roomId: roomId,
      },
      order: { id: 'DESC' },
      take: Number(limit) || 20,
      skip: Number(offset) || 0,
      relations: { user: true },
    });

    if (!messages) {
      throw new NotFoundException('Room does not exists');
    }
    return {
      total: total,
      messages,
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

  async getRoomByActiveUser(
    user: ActiveUserData,
    search: string,
  ): Promise<{ rooms: Room[] }> {
    const clientRooms = await this.roomsRepository.find({
      where: {
        client: { id: user.sub },
        provider: { name: Like(`%${search ? search : ''}%`) },
      },
      relations: { ...this.relations, messages: false },
    });

    const providerRooms = await this.roomsRepository.find({
      where: {
        provider: { id: user.sub },
        client: { name: Like(`%${search ? search : ''}%`) },
      },
      relations: { ...this.relations, messages: false },
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
    files: Express.Multer.File[],
    createMessageDto: CreateMessageDto,
    user: ActiveUserData,
  ): Promise<Message[]> {
    const newMessages = await this.sendMessageToRep(
      createMessageDto,
      user,
      files,
    );

    const room = await this.roomsRepository.findOne({
      where: { roomId: createMessageDto.roomId },
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

    await this.messagesRepository.update(
      { roomId: roomId, user: { id: Not(activeUserId) }, isRead: IsNull() },
      { isRead: true },
    );

    const newMessages = await this.messagesRepository.find({
      where: { id: In(messagesIds) },
      relations: { user: true },
    });

    await this.eventsGateway.handleReadMessageEvent({ roomId, newMessages });
  }

  private async sendMessageToRep(
    createMessageDto: CreateMessageDto,
    user: ActiveUserData,
    files: Express.Multer.File[],
  ): Promise<Message[]> {
    const authorUser = await this.usersRepository.findOne({
      where: { id: user.sub },
    });

    let images;
    if (files.length) {
      images = await this.getImages(files);
    }

    const newData = createMessageDto.message.map((messageDto, index) => {
      const newMessage = new Message();
      newMessage.timeSent = new Date(Date.now());
      newMessage.message = messageDto;
      newMessage.user = authorUser;
      newMessage.roomId = createMessageDto.roomId;
      newMessage.image =
        files.length && images[index].image ? images[index].image : null;

      this.messagesRepository.save(newMessage);
      return newMessage;
    });

    return newData;
  }

  private async getImages(
    files: Express.Multer.File[],
  ): Promise<{ image: string }[]> {
    const images = [] as { image: string }[];

    for (const file of files) {
      if (file.size === 0) {
        images.push({ image: '' });
      } else {
        const generatedName = uuidv4();
        const fileExtName = extname(file.originalname);
        const newName = `${generatedName}${fileExtName}`;

        const image = await this.s3_upload(
          file.buffer,
          this.AWS_S3_BUCKET,
          newName,
          file.mimetype,
        );

        images.push(image);
      }
    }

    return images;
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

  async s3_upload(file, bucket, name, mimetype): Promise<{ image: string }> {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
      ACL: 'public-read',
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: this.AWS_S3_BUCKET_LOCATION,
      },
    };

    try {
      const s3Response = await this.s3.upload(params).promise();
      return { image: s3Response.Location };
    } catch (e) {
      console.log(e);
    }
  }
}
