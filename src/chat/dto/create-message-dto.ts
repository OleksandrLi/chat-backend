import { IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ type: 'string', isArray: true })
  @IsArray()
  @IsString({ each: true })
  message: string[];

  @ApiProperty({ type: 'string' })
  @IsString()
  roomId: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  image: Express.Multer.File;
}
