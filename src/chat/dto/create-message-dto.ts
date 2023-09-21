import { IsString, ValidateNested } from 'class-validator';
import { User } from '../../users/entities/user.entity';
import { Type } from 'class-transformer';
import { UserForMessageDto } from './user-for-message.dto';

export class CreateMessageDto {
  @ValidateNested({ each: true, message: "Об'єкт має бути юзером" })
  @Type(() => UserForMessageDto)
  user: User;

  messageId: string;

  @IsString()
  timeSent: string;

  @IsString()
  message: string;

  @IsString()
  roomId: string;
}
