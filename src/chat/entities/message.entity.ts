import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Room } from './room.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinTable()
  @JoinColumn()
  @ManyToOne(() => User, () => User, { cascade: true })
  user: User;

  @Column({ nullable: true })
  timeSent: Date;

  @Column()
  message: string;

  @Column({ nullable: true })
  image: string;

  @Column()
  roomId: string;

  @Column({ nullable: true })
  isRead: boolean | null;

  @JoinTable()
  @ManyToMany(() => Room, (room) => room.messages)
  room: Room[];
}
