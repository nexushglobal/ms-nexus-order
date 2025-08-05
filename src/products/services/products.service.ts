import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'src/common/helpers/paginate.helper';
import { Repository } from 'typeorm';
import { FindProductsDto } from '../dto/find-products.dto';
import { Product } from '../entities/products.entity';
import { formatProductResponse } from '../helpers/format-product-response.helper';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}
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

  private async findAllProducts(findProductsDto: FindProductsDto) {
    const {
      page = 1,
      limit = 10,
      name,
      categoryId,
      isActive,
    } = findProductsDto;
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
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.addOrderBy('images.isMain', 'DESC');
    queryBuilder.addOrderBy('images.order', 'ASC');
    const [items, totalItems] = await queryBuilder.getManyAndCount();
    return {
      items,
      totalItems,
    };
  }

  private async findOneProduct(id: number, isActive?: boolean) {
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
}
