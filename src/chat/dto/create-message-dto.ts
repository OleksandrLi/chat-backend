import { IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  timeSent: Date;

  @IsString()
  message: string;

  @IsString()
  roomId: string;
}
