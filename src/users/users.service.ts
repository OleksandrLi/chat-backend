import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Not, Repository } from 'typeorm';
import { ActiveUserData } from '../iam/interfaces/active-user-data.interface';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  AWS_S3_BUCKET = process.env.AWS_S3_BUCKET_NAME;
  AWS_S3_BUCKET_LOCATION = process.env.AWS_S3_BUCKET_LOCATION;
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_ACCESS_KEY,
  });

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

  async uploadFile(file, user: ActiveUserData) {
    const generatedName = uuidv4();
    const fileExtName = extname(file.originalname);
    const newName = `${generatedName}${fileExtName}`;

    const updatedAvatar = await this.s3_upload(
      file.buffer,
      this.AWS_S3_BUCKET,
      newName,
      file.mimetype,
    );

    const userForUpdate = await this.usersRepository.preload({
      id: user.sub,
      image: updatedAvatar.image,
    });
    await this.usersRepository.save(userForUpdate);
    return { image: updatedAvatar.image };
  }

  async s3_upload(file, bucket, name, mimetype) {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
      ACL: 'public-read',
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: this.AWS_S3_BUCKET_LOCATION,
      },
    };

    try {
      const s3Response = await this.s3.upload(params).promise();
      console.log(s3Response.Location);
      return { image: s3Response.Location };
    } catch (e) {
      console.log(e);
    }
  }
}
