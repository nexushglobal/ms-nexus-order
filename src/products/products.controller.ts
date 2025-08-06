import {
  Controller,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AddProductImageMessageDto } from './dto/add-product-image-message.dto';
import { BulkCreateStockDto } from './dto/bulk-create-stock.dto';
import { CreateProductMessageDto } from './dto/create-product-message.dto';
import { DeleteProductImageMessageDto } from './dto/delete-product-image-message.dto';
import { FindProductsDto } from './dto/find-products.dto';
import { StockHistoryDto } from './dto/stock-history.dto';
import { UpdateProductImageMessageDto } from './dto/update-product-image-message.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ValidateStockExcelMessageDto } from './dto/valida-stock-excel-message.dto';
import { convertToBuffer } from './helpers/convert-to-buffer.helper';
import { createMulterFile } from './helpers/create-multer-file.helper';
import { ProductCategoryService } from './services/product-category.service';
import { ProductImageService } from './services/product-image.service';
import { ProductStockHistoryService } from './services/product-stock-history.service';
import { ProductsService } from './services/products.service';

@Controller()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productCategoryService: ProductCategoryService,
    private readonly productStockHistoryService: ProductStockHistoryService,
    private readonly productImageService: ProductImageService,
  ) {}

  @MessagePattern({ cmd: 'products.create' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createProduct(@Payload() data: CreateProductMessageDto) {
    const { createProductDto, files, userId } = data;
    const multerFiles: Express.Multer.File[] = files.map((file) => ({
      fieldname: file.fieldname || 'productImages',
      originalname: file.originalname,
      encoding: file.encoding || '7bit',
      mimetype: file.mimetype,
      size: file.size,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
      buffer: file.buffer,
    }));
    return await this.productsService.createProduct(
      createProductDto,
      multerFiles,
      userId,
    );
  }

  @MessagePattern({ cmd: 'products.findAll' })
  async findAll(@Payload() findProductsDto: FindProductsDto) {
    return this.productsService.findAll(findProductsDto);
  }

  @MessagePattern({ cmd: 'products.findOne' })
  async findOne(@Payload('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @MessagePattern({ cmd: 'products.update' })
  async updateProduct(@Payload() updateProductDto: UpdateProductDto) {
    return this.productsService.updateProduct(updateProductDto);
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

  @MessagePattern({ cmd: 'products.addImage' })
  async addImageToProduct(@Payload() data: AddProductImageMessageDto) {
    const { productId, file } = data;
    const multerFile = createMulterFile(data.file, file.buffer);
    return await this.productImageService.addImageToProduct(
      productId,
      multerFile,
    );
  }

  @MessagePattern({ cmd: 'products.updateImage' })
  async updateProductImage(@Payload() data: UpdateProductImageMessageDto) {
    const { productId, imageId, updateImageDto, file } = data;
    let multerFile: Express.Multer.File | undefined;
    if (file) multerFile = createMulterFile(data.file, file.buffer);
    return await this.productImageService.updateProductImage(
      productId,
      imageId,
      updateImageDto,
      multerFile,
    );
  }

  @MessagePattern({ cmd: 'products.deleteImage' })
  async deleteProductImage(@Payload() data: DeleteProductImageMessageDto) {
    const { productId, imageId } = data;
    return await this.productImageService.deleteProductImage(
      productId,
      imageId,
    );
  }

  @MessagePattern({ cmd: 'products.createStockHistory' })
  async createStockHistory(@Payload() data: StockHistoryDto) {
    return await this.productStockHistoryService.createStockHistory(data);
  }

  @MessagePattern({ cmd: 'products.bulkUpdateStock' })
  async bulkCreateStock(@Payload() bulkCreateStockDto: BulkCreateStockDto) {
    return await this.productStockHistoryService.bulkUpdateStock(
      bulkCreateStockDto,
    );
  }

  @MessagePattern({ cmd: 'products.validateStockExcel' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async validateStockExcel(@Payload() data: ValidateStockExcelMessageDto) {
    const buffer = convertToBuffer(data.file.buffer);
    const multerFile = createMulterFile(data.file, buffer);
    return await this.productsService.validateStockExcel(multerFile);
  }
}
