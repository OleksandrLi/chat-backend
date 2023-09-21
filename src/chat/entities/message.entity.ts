import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  messageId: string;

  @Column()
  user: User;

  @Column()
  timeSent: string;

  @Column()
  message: string;

  @Column()
  roomId: string;
}
