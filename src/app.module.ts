import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { databaseConfig } from './config/database.config';
import { MessagingModule } from './messaging/messaging.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    MessagingModule.register(),
    TypeOrmModule.forRootAsync({
      useFactory: () => databaseConfig,
    }),
    CommonModule,
    OrdersModule,
    ProductsModule,
  ],
})
export class AppModule {}
