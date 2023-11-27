import { IsString } from 'class-validator';

export class GetRoomDto {
  @IsString()
  roomId: string;
}
