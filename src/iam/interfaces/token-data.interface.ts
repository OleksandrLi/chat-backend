export interface TokenDataInterface {
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
