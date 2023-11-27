import { Entity } from 'typeorm';

@Entity()
export class TokenData {
  accessToken: string;
  refreshToken: string;
  user?: {
    id: number;
    name: string;
    email: string;
    image: string;
    isOnline: boolean;
  };
}

@Entity()
export class RefreshTokenData {
  accessToken: string;
  refreshToken: string;
}
