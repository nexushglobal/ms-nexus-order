import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductCategory } from './product-category.entity';
import { ProductImage } from './product-image.entity';
import { ProductStockHistory } from './product-stock-history.entity';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('text')
  composition?: string;

  @Column({
    type: 'decimal',
    name: 'number_price',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  memberPrice: number;

  @Column({
    type: 'decimal',
    name: 'public_price',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  publicPrice: number;

  @Column('int')
  stock: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @Column({
    type: 'text',
    array: true,
    default: [],
  })
  benefits: string[];

  @Column({ unique: true })
  sku: string;

  @ManyToOne(() => ProductCategory, (category) => category.products)
  category: ProductCategory;

  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
    eager: true,
  })
  images: ProductImage[];

  @OneToMany(() => ProductStockHistory, (history) => history.product)
  stockHistory: ProductStockHistory[];

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  checkStock() {
    if (this.stock === 0 && this.status === ProductStatus.ACTIVE) {
      this.status = ProductStatus.OUT_OF_STOCK;
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  transformSku() {
    if (this.sku) {
      this.sku = this.sku.trim().toUpperCase();
    }
  }
}
