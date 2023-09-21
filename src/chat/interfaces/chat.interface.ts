export interface User {
  id: number;
  name: string;
  email: string;
  image: string;
  isActive?: boolean;
}

export interface Message {
  id: number;
  messageId: string;
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
