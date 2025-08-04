import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from '../enums/orders-status.enum';
import { OrdersDetails } from './orders-details.entity';
import { OrderHistory } from './orders-history.entity';

@Entity('orders')
@Index(['userId'])
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: string; // UUID del usuario desde el microservicio de usuarios

  @Column({ name: 'user_email' })
  userEmail: string; // Email para referencia rápida

  @Column({ name: 'user_name', nullable: true })
  userName?: string; // Nombre completo para referencia

  @OneToMany(() => OrdersDetails, (item) => item.order, {
    cascade: true,
  })
  orderDetails: OrdersDetails[];

  @OneToMany(() => OrderHistory, (history) => history.order, {
    cascade: true,
  })
  orderHistory: OrderHistory[];

  @Column({ type: 'integer', name: 'total_items' })
  totalItems: number;

  @Column({
    type: 'decimal',
    name: 'total_amount',
    precision: 10,
    scale: 2,
    default: 217,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  totalAmount: number;

  @Column({ default: 'PENDING' })
  status: OrderStatus;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
