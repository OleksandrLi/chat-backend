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

  @JoinTable()
  @JoinColumn()
  @ManyToOne(() => User, () => User, { cascade: true })
  client: User;

  @JoinTable()
  @JoinColumn()
  @ManyToOne(() => User, () => User, { cascade: true })
  provider: User;

  @JoinTable()
  @ManyToMany(() => Message, (message) => message, { cascade: true })
  messages: Message[];
}
