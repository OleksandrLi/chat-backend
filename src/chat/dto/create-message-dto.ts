import { IsString, IsArray } from 'class-validator';

export class CreateMessageDto {
  @IsArray()
  @IsString({ each: true })
  message: string[];

  @IsString()
  roomId: string;

  image: File;
}
