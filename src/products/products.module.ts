import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { ProductCategory } from './entities/product-category.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductStockHistory } from './entities/product-stock-history.entity';
import { Product } from './entities/products.entity';
import { ProductsController } from './products.controller';
import { ProductCategoryService } from './services/product-category.service';
import { ProductImageService } from './services/product-image.service';
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
    CommonModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductStockHistoryService,
    ProductCategoryService,
    ProductImageService,
  ],
  exports: [
    ProductsService,
    ProductStockHistoryService,
    ProductCategoryService,
    ProductImageService,
    TypeOrmModule,
  ],
})
export class ProductsModule {}
