import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { paginate } from 'src/common/helpers/paginate.helper';
import { QueryRunner, Repository } from 'typeorm';
import { CreateInitialStockDto } from '../dto/create-initial-stock.dto';
import { ProductStockHistory } from '../entities/product-stock-history.entity';
import { Product } from '../entities/products.entity';
import { StockActionType } from '../enums/stock-action-type.enum';

@Injectable()
export class ProductStockHistoryService {
  constructor(
    @InjectRepository(ProductStockHistory)
    private readonly productStockHistoryRepository: Repository<ProductStockHistory>,
  ) {}

  async findAllStockHistory(productId: number, paginationDto: PaginationDto) {
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

  async createInitialStock(
    createInitialStockDto: CreateInitialStockDto,
    savedProduct: Product,
    queryRunner?: QueryRunner,
  ): Promise<ProductStockHistory> {
    const { stock, userId, userEmail, userName } = createInitialStockDto;
    const repository = queryRunner
      ? queryRunner.manager.getRepository(ProductStockHistory)
      : this.productStockHistoryRepository;
    const stockHistory = repository.create({
      product: savedProduct,
      actionType: StockActionType.UPDATE,
      previousQuantity: 0,
      newQuantity: stock,
      quantityChanged: stock,
      notes: 'Stock inicial',
      userId: userId,
      userEmail: userEmail,
      userName: userName,
    });
    const savedStockHistory = await repository.save(stockHistory);
    return savedStockHistory;
  }
}
