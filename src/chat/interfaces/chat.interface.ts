import { User } from '../../users/entities/user.entity';

export interface IRoom {
  id: number;
  roomId: string;
  usersIds: number[];
}

export interface Message {
  user: User;
  timeSent: string;
  message: string;
  roomId: string;
}

export interface ServerToClientEvents {
  chat: (e: Message) => void;
}

export interface ClientToServerEvents {
  chat: (e: Message) => void;
  join_room: (e: { user: User; roomName: string }) => void;
}
