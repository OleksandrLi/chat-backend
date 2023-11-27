import { Column, Entity } from 'typeorm';

@Entity()
export class Avatar {
  @Column({ nullable: true })
  image: string | null;
}
