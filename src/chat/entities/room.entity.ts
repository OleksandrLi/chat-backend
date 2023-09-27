import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Message } from './message.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  roomId: string;

  // @Column('int', { array: true })
  // usersIds: number[];

  @JoinTable()
  @JoinColumn()
  @ManyToOne((type) => User, (user) => User, { cascade: true })
  client: User;

  @JoinTable()
  @JoinColumn()
  @ManyToOne((type) => User, (user) => User, { cascade: true })
  provider: User;

  @JoinTable()
  @ManyToMany((type) => Message, (message) => message, { cascade: true })
  messages: Message[];
}
