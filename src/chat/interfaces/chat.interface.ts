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
  user: (e: { userId: number; isOnline: true }) => void;
  chat: (e: Message) => void;
  online: (e: { userId: number }) => void;
}

export interface ClientToServerEvents {
  chat: (e: Message) => void;
  join_room: (e: { user: User; roomName: string }) => void;
  online: (e: { userId: number }) => void;
}
