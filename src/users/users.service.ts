import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { ActiveUserData } from '../iam/interfaces/active-user-data.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findAll() {
    const users = await this.usersRepository.find({
      select: { email: true, name: true },
    });
    return users;
  }

  async findProfile(user: ActiveUserData) {
    const userProfile = await this.usersRepository.findOne({
      where: { id: user.sub },
    });
    return {
      profile: {
        name: userProfile.name,
        email: userProfile.email,
        image: userProfile.image,
      },
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async uploadAvatar(file, user: ActiveUserData) {
    const response = {
      originalname: file.originalname,
      filename: file.filename,
    };

    const userForUpdate = await this.usersRepository.preload({
      id: user.sub,
      image: `${process.env.API_URL}/uploads/${response.filename}`,
    });
    await this.usersRepository.save(userForUpdate);
    return { image: `${process.env.API_URL}/uploads/${response.filename}` };
  }
}
