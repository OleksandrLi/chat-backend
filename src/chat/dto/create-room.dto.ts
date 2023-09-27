import { IsNumber } from 'class-validator';

export class CreateRoomDto {
  // @IsArray()
  // @IsNumber({}, { each: true })
  // usersIds: number[];

  @IsNumber()
  providerId: number;
}
