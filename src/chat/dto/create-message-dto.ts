import { IsString } from 'class-validator';

export class CreateMessageDto {
  // @ValidateNested({ each: true, message: "Об'єкт має бути юзером" })
  // @Type(() => UserForMessageDto)
  // user: User;

  @IsString()
  timeSent: Date;

  @IsString()
  message: string;

  @IsString()
  roomId: string;
}
