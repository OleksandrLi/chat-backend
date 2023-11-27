import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MessagesPaginationQueryDto {
  @ApiProperty({ type: 'string', required: false })
  @IsString()
  @IsOptional()
  limit: string;

  @ApiProperty({ type: 'string', required: false })
  @IsString()
  @IsOptional()
  offset: string;
}
