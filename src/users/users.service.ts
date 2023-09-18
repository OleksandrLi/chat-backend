import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Not, Repository } from 'typeorm';
import { ActiveUserData } from '../iam/interfaces/active-user-data.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(user: ActiveUserData) {
    const users = await this.usersRepository.find({
      where: { id: Not(user.sub) },
      select: { id: true, email: true, name: true, image: true },
    });
    return { users };
  }

  async findProfile(user: ActiveUserData) {
    const userProfile = await this.usersRepository.findOne({
      where: { id: user.sub },
    });
    return {
      profile: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        image: userProfile.image,
      },
    };
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id: id },
      select: { id: true, email: true, name: true, image: true },
    });
    return { user };
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
