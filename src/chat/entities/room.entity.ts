import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  roomId: string;

  @Column('int', { array: true })
  users: number[];
}
