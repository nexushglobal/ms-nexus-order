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
    name: 'action_type',
  })
  actionType: StockActionType;

  @Column({ name: 'previous_quantity' })
  previousQuantity: number;

  @Column({ name: 'new_quantity' })
  newQuantity: number;

  @Column({ name: 'quantity_changed' })
  quantityChanged: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'user_email' })
  userEmail: string;

  @Column({ name: 'user_name', nullable: true })
  userName?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
