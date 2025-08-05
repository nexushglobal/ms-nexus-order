import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { paginate } from 'src/common/helpers/paginate.helper';
import { Repository } from 'typeorm';
import { ProductStockHistory } from '../entities/product-stock-history.entity';
import { ProductsService } from './products.service';

@Injectable()
export class ProductStockHistoryService {
  constructor(
    @InjectRepository(ProductStockHistory)
    private readonly productStockHistoryRepository: Repository<ProductStockHistory>,
    private readonly productsService: ProductsService,
  ) {}

  async findAllStockHistory(productId: number, paginationDto: PaginationDto) {
    await this.productsService.findOne(productId);
    const { page = 1, limit = 10 } = paginationDto;
    const queryBuilder = this.productStockHistoryRepository
      .createQueryBuilder('history')
      .where('history.product.id = :productId', { productId })
      .orderBy('history.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const stockHistory = await queryBuilder.getMany();

    const items = stockHistory.map((history) => ({
      id: history.id,
      actionType: history.actionType,
      previousQuantity: history.previousQuantity,
      newQuantity: history.newQuantity,
      quantityChanged: history.quantityChanged,
      notes: history.notes,
      createdAt: history.createdAt,
      updatedBy: history.userId
        ? {
            id: history.userId,
            email: history.userEmail,
          }
        : null,
    }));
    const paginatedResult = paginate(items, paginationDto);
    return paginatedResult;
  }
}
