import { IsNumber, IsString, IsEmail } from 'class-validator';

export class UserForRoomDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  image: string;
}
