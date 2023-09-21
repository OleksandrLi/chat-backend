import { User } from '../../users/entities/user.entity';
import { Message } from '../entities/message.entity';

export interface ServerToClientEvents {
  chat: (e: Message) => void;
}

export interface ClientToServerEvents {
  chat: (e: Message) => void;
  join_room: (e: { user: User; roomName: string }) => void;
}
