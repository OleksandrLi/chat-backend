import {
  IsArray,
  IsNumber,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserForRoomDto } from './user-for-room.dto';

export class CreateRoomDto {
  roomId: string;

  @IsArray()
  @IsNumber({}, { each: true })
  usersIds: number[];

  @IsArray({ message: 'Має бути список юзерів' })
  @ArrayMinSize(2, { message: 'Має бути два юзера' })
  @ArrayMaxSize(2, { message: 'Має бути два юзера' })
  @ValidateNested({ each: true, message: "Об'єкт має бути юзером" })
  @Type(() => UserForRoomDto)
  users: UserForRoomDto[];
}
