import { IsNumber, IsString } from 'class-validator';

export class UserForMessageDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;
}
