import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'src/common/helpers/paginate.helper';
import { Repository } from 'typeorm';
import { FindAllOrdersAdminDto } from './dto/find-all-orders-admin.dto';
import { FindAllOrdersClientDto } from './dto/find-all-orders-client.dto';
import { Order } from './entities/orders.entity';
import { formatOrderOneResponse } from './helpers/format-order-one-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findAll(findAllOrdersAdminDto: FindAllOrdersAdminDto) {
    return await this.findAllOrders(findAllOrdersAdminDto);
  }

  async findOne(id: number) {
    const order = await this.findOneOrder(id);
    return formatOrderOneResponse(order);
  }

  // CLIENT
  async findAllWithClients(findAllOrdersClientDto: FindAllOrdersClientDto) {
    return await this.findAllOrders(findAllOrdersClientDto);
  }

  async findOneWithClients(id: number) {
    const order = await this.findOneOrder(id);
    return formatOrderOneResponse(order);
  }

  private async findAllOrders(findAllOrdersAdminDto: FindAllOrdersAdminDto) {
    const { term, endDate, startDate, status, userId, ...paginationDto } =
      findAllOrdersAdminDto;
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .orderBy('order.createdAt', 'DESC');
    if (userId) queryBuilder.where('order.user_id = :userId', { userId });
    if (!userId)
      queryBuilder.addSelect([
        'order.user_id',
        'order.user_email',
        'order.user_name',
      ]);
    if (term)
      queryBuilder.andWhere(
        '(order.user_email LIKE :term OR order.user_name LIKE :term)',
        { term: `%${term}%` },
      );
    if (status) queryBuilder.andWhere('order.status = :status', { status });

    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('order.createdAt <= :endDate', {
        endDate: endOfDay,
      });
    }
    if (startDate)
      queryBuilder.andWhere('order.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });

    const items = await queryBuilder.getMany();
    const orderList = paginate(items, paginationDto);
    return orderList;
  }

  private async findOneOrder(id: number) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'orderDetails',
        'orderDetails.product',
        'orderDetails.product.images',
        'orderHistory',
      ],
    });

    if (!order)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Orden con ID ${id} no encontrada`,
      });
    return order;
  }
}
