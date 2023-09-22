import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Room } from './room.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  messageId: string;

  @Column({
    type: 'jsonb',
    default: () => "'{}'",
    nullable: true,
  })
  user: User;

  @Column({ nullable: true })
  timeSent: Date;

  @Column()
  message: string;

  @Column()
  roomId: string;

  @Column({ nullable: true })
  isRead: boolean;

  @JoinTable()
  @ManyToMany((type) => Room, (room) => room.messages)
  room: Room[];
}
