import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Message } from './message.entity';
import { User } from '../interfaces/chat.interface';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  roomId: string;

  @Column('int', { array: true })
  usersIds: number[];

  @Column({
    type: 'jsonb',
    array: false,
    default: () => "'[]'",
    nullable: false,
  })
  users: Array<User>;

  @JoinTable()
  @ManyToMany((type) => Message, (message) => message, { cascade: true })
  messages: Message[];
}
