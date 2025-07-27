import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './products.entity';

@Entity('product_categories')
export class ProductCategory {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ unique: true })
  code: string;

  @Column({ default: 0 })
  order: number;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  transformCode() {
    if (this.code) {
      this.code = this.code.trim().toUpperCase();
    }
  }
}
