import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategory } from './entities/product-category.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductStockHistory } from './entities/product-stock-history.entity';
import { Product } from './entities/products.entity';
import { ProductsController } from './products.controller';
import { ProductCategoryService } from './services/product-category.service';
import { ProductStockHistoryService } from './services/product-stock-history.service';
import { ProductsService } from './services/products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductCategory,
      ProductImage,
      ProductStockHistory,
    ]),
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductStockHistoryService,
    ProductCategoryService,
  ],
  exports: [
    ProductsService,
    ProductStockHistoryService,
    ProductCategoryService,
    TypeOrmModule,
  ],
})
export class ProductsModule {}
