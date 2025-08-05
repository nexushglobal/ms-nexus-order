import { Controller, ParseIntPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FindProductsDto } from './dto/find-products.dto';
import { ProductCategoryService } from './services/product-category.service';
import { ProductStockHistoryService } from './services/product-stock-history.service';
import { ProductsService } from './services/products.service';

@Controller()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productCategoryService: ProductCategoryService,
    private readonly productStockHistoryService: ProductStockHistoryService,
  ) {}

  @MessagePattern({ cmd: 'products.findAll' })
  async findAll(@Payload() findProductsDto: FindProductsDto) {
    return this.productsService.findAll(findProductsDto);
  }

  @MessagePattern({ cmd: 'products.findOne' })
  async findOne(@Payload('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @MessagePattern({ cmd: 'products.findStockHistory' })
  async findStockHistory(
    @Payload('productId', ParseIntPipe) productId: number,
    @Payload() paginationDto,
  ) {
    return this.productStockHistoryService.findAllStockHistory(
      productId,
      paginationDto,
    );
  }

  @MessagePattern({ cmd: 'products.findAllWithSkuAndName' })
  async findAllWithSkuAndName() {
    return this.productsService.findAllWithSkuAndName();
  }

  @MessagePattern({ cmd: 'products.findAllCategories' })
  async findAllCategories(
    @Payload('includeInactive') includeInactive?: boolean,
  ) {
    return this.productCategoryService.findAllCategories(includeInactive);
  }
}
