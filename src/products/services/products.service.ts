import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { paginate } from 'src/common/helpers/paginate.helper';
import { UsersService } from 'src/common/services/users.service';
import { DataSource, In, Repository } from 'typeorm';
import {
  CreateProductDto,
  CreateProductResponseDto,
} from '../dto/create-product.dto';
import { ExcelStockUpdateDto } from '../dto/excel-stock-update.dto';
import { FindProductsDto } from '../dto/find-products.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductImage } from '../entities/product-image.entity';
import { Product, ProductStatus } from '../entities/products.entity';
import { formatCreateProductResponse } from '../helpers/format-create-product-response.helper';
import { formatProductResponse } from '../helpers/format-product-response.helper';
import { formatUpdateProductResponse } from '../helpers/format-update-product-response.helper';
import { ProductCategoryService } from './product-category.service';
import { ProductImageService } from './product-image.service';
import { ProductStockHistoryService } from './product-stock-history.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly productCategoryService: ProductCategoryService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => ProductStockHistoryService))
    private readonly productStockHistoryService: ProductStockHistoryService,
    @Inject(forwardRef(() => ProductImageService))
    private readonly productImageService: ProductImageService,
    private readonly usersService: UsersService,
  ) {}
  async createProduct(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
    userId: string,
  ): Promise<CreateProductResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const category = await this.productCategoryService.findOneCategory(
        createProductDto.categoryId,
      );
      const sku = await this.generateSku(category.code, createProductDto.name);
      const product = this.productsRepository.create({
        name: createProductDto.name,
        description: createProductDto.description,
        memberPrice: createProductDto.memberPrice,
        composition: createProductDto.composition,
        publicPrice: createProductDto.publicPrice,
        stock: createProductDto.stock || 0,
        benefits: createProductDto.benefits || [],
        sku,
        category,
        status:
          createProductDto.stock === 0
            ? ProductStatus.OUT_OF_STOCK
            : ProductStatus.ACTIVE,
        isActive: createProductDto.isActive,
      });
      let savedImages: ProductImage[] = [];
      const savedProduct = await queryRunner.manager.save(product);
      if (files && files.length > 0) {
        const uploadImagesDto = {
          files,
          productId: savedProduct.id,
        };
        savedImages = await this.productImageService.uploadProductImages(
          uploadImagesDto,
          savedProduct,
          queryRunner,
        );
        console.log(`${savedImages.length} imágenes subidas exitosamente`);
      }

      if (createProductDto.stock !== undefined && createProductDto.stock > 0) {
        const user = await this.usersService.getUser(userId);
        await this.findOne(savedProduct.id);
        await this.productStockHistoryService.createInitialStock(
          {
            stock: createProductDto.stock,
            userId,
            userEmail: user.email,
            userName: user.nickname || '',
          },
          savedProduct,
          queryRunner,
        );
      }
      await queryRunner.commitTransaction();

      return formatCreateProductResponse(savedProduct);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // this.logger.error(`Error al crear producto: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(findProductsDto: FindProductsDto) {
    const { page, limit } = findProductsDto;
    const paginationDto = { page, limit };
    const products = await this.findAllProducts(findProductsDto);
    const { items } = products;
    const formattedItems = items.map((product) => {
      return {
        ...formatProductResponse(product),
        stock: product.stock,
        status: product.status,
        isActive: product.isActive,
        mainImage:
          product.images && product.images.length > 0
            ? product.images.find((img) => img.isMain)?.url ||
              product.images[0].url
            : null,
      };
    });
    const productsList = paginate(formattedItems, paginationDto);
    return productsList;
  }

  async findOne(id: number) {
    const product = await this.findOneProduct(id);
    const formattedProduct = {
      ...formatProductResponse(product),
      images: product.images?.map((img) => ({
        id: img.id,
        url: img.url,
        isMain: img.isMain,
        order: img.order,
      })),
    };
    return formattedProduct;
  }

  async findAllWithSkuAndName() {
    const products = await this.productsRepository.find({
      select: ['id', 'name', 'sku'],
    });
    const formattedItems = products.map((product) => {
      const { id, name, sku } = product;
      return { id, name, sku };
    });
    return formattedItems;
  }

  async updateProduct(updateProductDto: UpdateProductDto) {
    const { productId, ...restData } = updateProductDto;
    await this.findOneProduct(productId);
    if (updateProductDto.categoryId)
      await this.productCategoryService.findOneCategory(
        updateProductDto.categoryId,
      );
    const product = await this.productsRepository.preload({
      id: productId,
      ...restData,
    });
    if (!product)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Producto con ID ${productId} no encontrado`,
      });
    const updatedProduct = await this.productsRepository.save(product);
    return formatUpdateProductResponse(updatedProduct);
  }

  private async findAllProducts(findProductsDto: FindProductsDto) {
    const { name, categoryId, isActive } = findProductsDto;
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images');
    if (name)
      queryBuilder.andWhere('LOWER(product.name) LIKE LOWER(:name)', {
        name: `%${name.toLowerCase()}%`,
      });
    if (categoryId)
      queryBuilder.andWhere('category.id = :categoryId', { categoryId });
    if (isActive !== undefined)
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    queryBuilder.addOrderBy('images.isMain', 'DESC');
    queryBuilder.addOrderBy('images.order', 'ASC');
    const [items, totalItems] = await queryBuilder.getManyAndCount();
    return {
      items,
      totalItems,
    };
  }

  async findOneProduct(id: number, isActive?: boolean) {
    const whereCondition = isActive ? { id, isActive } : { id };
    const product = await this.productsRepository.findOne({
      where: whereCondition,
      relations: ['category', 'images'],
    });

    if (!product)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Producto con ID ${id} no encontrado`,
      });

    if (product.images)
      product.images.sort((a, b) => {
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;
        return a.order - b.order;
      });
    return product;
  }

  async validateStockExcel(file: Express.Multer.File) {
    if (!file)
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Archivo no proporcionado',
      });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const worksheet = workbook.worksheets[0];
    const errors: string[] = [];
    const validRows: ExcelStockUpdateDto[] = [];

    // Validacion de estructura del Excel (Encabezado)
    const expectedHeaders = ['ID', 'Producto', 'Cantidad'];
    const actualHeaders = worksheet.getRow(1).values as string[];
    if (!expectedHeaders.every((header) => actualHeaders.includes(header)))
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Encabezado del archivo no es el esperado',
      });
    // Procesar filas
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber === 1) return; // salto de encabezados
      try {
        const rowData: ExcelStockUpdateDto = {
          productId: row.getCell(1).value as number,
          productName: row.getCell(2).value as string,
          newQuantity: row.getCell(3).value as number,
        };
        // Validaciones básicas
        if (!rowData.productId || isNaN(rowData.productId))
          throw new RpcException({
            status: HttpStatus.BAD_REQUEST,
            message: `Fila ${rowNumber}: ID del producto inválido`,
          });

        if (!rowData.productName || typeof rowData.productName !== 'string')
          throw new RpcException({
            status: HttpStatus.BAD_REQUEST,
            message: `Fila ${rowNumber}: Nombre del producto inválido`,
          });

        if (
          !rowData.newQuantity ||
          isNaN(rowData.newQuantity) ||
          !Number.isInteger(rowData.newQuantity)
        )
          throw new RpcException({
            status: HttpStatus.BAD_REQUEST,
            message: `Fila ${rowNumber}: Cantidad debe ser un número entero`,
          });
        validRows.push(rowData);
      } catch (error) {
        errors.push(error.message);
      }
    });
    const productIds = validRows.map((row) => row.productId);
    const existingProducts = await this.productsRepository.find({
      where: { id: In(productIds) },
    });
    const existingProductIds = existingProducts.map((p) => p.id);
    const missingProducts = validRows.filter(
      (row) => !existingProductIds.includes(row.productId),
    );
    missingProducts.forEach((row) => {
      errors.push(
        `Producto con ID ${row.productId} no encontrado en base de datos`,
      );
    });
    const validatedProducts = validRows
      .filter((row) => existingProductIds.includes(row.productId))
      .map((row) => {
        const product = existingProducts.find((p) => p.id === row.productId);
        return {
          productId: row.productId,
          productName: product?.name, // Nombre desde la base de datos
          newQuantity: row.newQuantity, // Stock actual desde la base de datos
        };
      });
    return {
      isValid: errors.length === 0,
      errorCount: errors.length,
      validProducts: errors.length === 0 ? validatedProducts : errors,
    };
  }

  private async generateSku(
    categoryCode: string,
    productName: string,
  ): Promise<string> {
    const prefix = categoryCode.substring(0, 3).toUpperCase();
    let productPrefix = '';
    const words = productName.trim().split(' ');
    if (words.length > 0)
      productPrefix = words[0].substring(0, 3).toUpperCase();

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now().toString().slice(-4);
    const sku = `${prefix}-${productPrefix}${randomNum}${timestamp}`;
    const existingProduct = await this.productsRepository.findOne({
      where: { sku },
    });

    if (existingProduct) return this.generateSku(categoryCode, productName);
    return sku;
  }
}
