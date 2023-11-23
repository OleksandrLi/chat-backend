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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  findProfile(@ActiveUser() user: ActiveUserData): Promise<{ profile: User }> {
    return this.usersService.findProfile(user);
  }

  @Get()
  findAll(
    @Query() usersQuery,
    @ActiveUser() user: ActiveUserData,
  ): Promise<{ users: User[] }> {
    const { search } = usersQuery;
    return this.usersService.findAll(user, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<{ user: User }> {
    return this.usersService.findOne(+id);
  }

  @Post('update-avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @ActiveUser() user: ActiveUserData,
  ): Promise<{ image: string }> {
    return this.usersService.uploadFile(file, user);
  }
}
