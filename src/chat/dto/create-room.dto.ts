import { IsNumber } from 'class-validator';

export class CreateRoomDto {
  @IsNumber()
  providerId: number;
}
