import { Injectable } from '@nestjs/common';
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
}
