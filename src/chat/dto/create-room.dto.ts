import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ description: 'Айді юзера, з яким ви створюєте кімнату чату' })
  @IsNumber()
  providerId: number;
}
