import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { paginate } from 'src/common/helpers/paginate.helper';
import { UsersService } from 'src/common/services/users.service';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import {
  BulkCreateStockDto,
  BulkCreateStockResponseDto,
} from '../dto/bulk-create-stock.dto';
import { CreateInitialStockDto } from '../dto/create-initial-stock.dto';
import { StockHistoryDto } from '../dto/stock-history.dto';
import { ProductStockHistory } from '../entities/product-stock-history.entity';
import { Product } from '../entities/products.entity';
import { StockActionType } from '../enums/stock-action-type.enum';
import { ProductsService } from './products.service';

@Injectable()
export class ProductStockHistoryService {
  private readonly logger = new Logger(ProductStockHistoryService.name);
  constructor(
    @InjectRepository(ProductStockHistory)
    private readonly productStockHistoryRepository: Repository<ProductStockHistory>,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async findAllStockHistory(productId: number, paginationDto: PaginationDto) {
    // const { page = 1, limit = 10 } = paginationDto;
    const queryBuilder = this.productStockHistoryRepository
      .createQueryBuilder('history')
      .where('history.product.id = :productId', { productId })
      .orderBy('history.createdAt', 'DESC');

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

  async createStockHistory(stockHistoryDto: StockHistoryDto) {
    const { productId, userId } = stockHistoryDto;
    const user = await this.usersService.getUser(userId);
    const product = await this.productsService.findOneProduct(productId);
    if (
      stockHistoryDto.actionType === StockActionType.DECREASE &&
      product.stock < stockHistoryDto.quantity
    )
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `No se puede disminuir el stock por debajo de 0`,
      });

    let newStock: number;
    let quantityChanged: number;

    switch (stockHistoryDto.actionType) {
      case StockActionType.INCREASE:
        newStock = product.stock + stockHistoryDto.quantity;
        quantityChanged = stockHistoryDto.quantity;
        break;
      case StockActionType.DECREASE:
        newStock = product.stock - stockHistoryDto.quantity;
        quantityChanged = -stockHistoryDto.quantity;
        break;
      case StockActionType.UPDATE:
        newStock = stockHistoryDto.quantity;
        quantityChanged = stockHistoryDto.quantity - product.stock;
        break;
      default:
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST, // 400
          message: `Tipo de acción no válido. Debe ser INCREASE, DECREASE o UPDATE`,
        });
    }
    // Crear historial de stock
    const stockHistory = this.productStockHistoryRepository.create({
      product,
      actionType: stockHistoryDto.actionType,
      previousQuantity: product.stock,
      newQuantity: newStock,
      quantityChanged,
      notes:
        stockHistoryDto.description ||
        this.getDefaultNote(stockHistoryDto.actionType),
      userId: userId,
      userEmail: user.email,
      userName: user.nickname || '',
    });
    // Actualizar stock del producto
    product.stock = newStock;
    // Guardar cambios
    await this.productStockHistoryRepository.save(stockHistory);
    return { message: 'Stock history created successfully' };
  }

  async bulkUpdateStock(bulkCreateStockDto: BulkCreateStockDto) {
    const { products, userId } = bulkCreateStockDto;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const results: BulkCreateStockResponseDto[] = [];

      for (const productData of products) {
        const product = await this.productsService.findOneProduct(
          productData.productId,
        );
        // 1. Actualizar el stock del producto
        const stockHistoryDto = {
          productId: productData.productId,
          actionType: StockActionType.UPDATE,
          previousQuantity: product.stock,
          quantity: productData.newQuantity,
          quantityChanged: productData.newQuantity + product.stock,
          notes: 'Actualización masiva desde Excel',
          userId,
        };
        await this.createStockHistory(stockHistoryDto);
        await this.productsService.updateProduct({
          productId: productData.productId,
          stock: productData.newQuantity + product.stock,
        });
        results.push({
          productId: productData.productId,
          productName: product.name,
          previousStock: product.stock,
          newStock: productData.newQuantity,
          changedStock: productData.newQuantity + product.stock,
        });
      }
      await queryRunner.commitTransaction();
      return results;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error en actualización masiva: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private getDefaultNote(actionType: StockActionType): string {
    const notesMap = {
      [StockActionType.INCREASE]: 'Aumento de stock',
      [StockActionType.DECREASE]: 'Disminución de stock',
      [StockActionType.UPDATE]: 'Actualización de stock',
    };
    return notesMap[actionType] || 'Cambio de stock';
  }
}
