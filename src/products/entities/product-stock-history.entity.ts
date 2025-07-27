import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockActionType } from '../enums/stock-action-type.enum';
import { Product } from './products.entity';

@Entity('product_stock_history')
export class ProductStockHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.stockHistory, {
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    type: 'enum',
    enum: StockActionType,
  })
  actionType: StockActionType;

  @Column()
  previousQuantity: number;

  @Column()
  newQuantity: number;

  @Column()
  quantityChanged: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'user_email' })
  userEmail: string;

  @Column({ name: 'user_name', nullable: true })
  userName?: string;

  @CreateDateColumn()
  createdAt: Date;
}
