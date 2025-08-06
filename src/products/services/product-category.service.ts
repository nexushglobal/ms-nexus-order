import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from '../entities/product-category.entity';

@Injectable()
export class ProductCategoryService {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly productCategoryRepository: Repository<ProductCategory>,
  ) {}

  async findAllCategories(includeInactive = false) {
    const queryBuilder = this.productCategoryRepository
      .createQueryBuilder('category')
      .orderBy('category.order', 'ASC')
      .addOrderBy('category.name', 'ASC');

    if (!includeInactive)
      queryBuilder.where('category.isActive = :isActive', { isActive: true });
    const categories = await queryBuilder.getMany();
    return categories;
  }

  async findOneCategory(id: number): Promise<ProductCategory> {
    const category = await this.productCategoryRepository.findOne({
      where: { id },
    });
    if (!category)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Categoría con ID ${id} no encontrada`,
      });
    return category;
  }
}
