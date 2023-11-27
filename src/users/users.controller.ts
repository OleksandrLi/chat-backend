import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ActiveUser } from '../iam/decorators/active-user-decorator';
import { ActiveUserData } from '../iam/interfaces/active-user-data.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from './entities/user.entity';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Avatar } from './entities/avatar.entity';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { UsersQueryDto } from './dto/users-query.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOkResponse({
    description: 'Get active user',
    type: User,
  })
  findProfile(@ActiveUser() user: ActiveUserData): Promise<{ profile: User }> {
    return this.usersService.findProfile(user);
  }

  @Get()
  @ApiOkResponse({
    description: 'Users list',
    type: User,
    isArray: true,
  })
  findAll(
    @Query() usersQuery: UsersQueryDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<{ users: User[] }> {
    const { search } = usersQuery;
    return this.usersService.findAll(user, search);
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'User by id',
    type: User,
  })
  findOne(@Param('id') id: string): Promise<{ user: User }> {
    return this.usersService.findOne(+id);
  }

  @Post('update-avatar')
  @ApiOkResponse({
    description: 'Update avatar for current user',
  })
  @ApiBody({
    type: UploadAvatarDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Avatar> {
    return this.usersService.uploadFile(file, user);
  }
}
