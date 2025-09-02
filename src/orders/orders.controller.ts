import {
  Controller,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindAllOrdersAdminDto } from './dto/find-all-orders-admin.dto';
import { FindAllOrdersClientDto } from './dto/find-all-orders-client.dto';
import { FindUserOrdersByPeriodDto } from './dto/find-user-orders-by-period.dto';
import { OrderStatus } from './enums/orders-status.enum';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({ cmd: 'orders.findAll' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Payload() findAllOrdersAdminDto: FindAllOrdersAdminDto) {
    return await this.ordersService.findAll(findAllOrdersAdminDto);
  }

  @MessagePattern({ cmd: 'orders.findOne' })
  async findOne(@Payload('orderId', ParseIntPipe) id: number) {
    return await this.ordersService.findOne(id);
  }

  @MessagePattern({ cmd: 'orders.findAllWithClients' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAllWithClients(
    @Payload() findAllOrdersClientDto: FindAllOrdersClientDto,
  ) {
    return await this.ordersService.findAllWithClients(findAllOrdersClientDto);
  }

  @MessagePattern({ cmd: 'orders.findOneWithClients' })
  async findOneWithClients(@Payload('orderId', ParseIntPipe) id: number) {
    return await this.ordersService.findOneWithClients(id);
  }

  @MessagePattern({ cmd: 'orders.createOrder' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createOrder(
    @Payload() payload: { userId: string; dto: CreateOrderDto; files?: any[] },
  ) {
    return await this.ordersService.createOrder(payload);
  }

  @MessagePattern({ cmd: 'orders.markOrderAsSent' })
  async markOrderAsSent(@Payload() data: { orderId: number }) {
    return await this.ordersService.markOrderAsSent(data.orderId);
  }
  // Métodos internos llamados solo desde PaymentService (no endpoints públicos)
  @MessagePattern({ cmd: 'orders.internal.updateOrderStatus' })
  async updateOrderStatus(
    @Payload()
    data: {
      orderId: number;
      status: OrderStatus;
      paymentId?: number;
      rejectionReason?: string;
    },
  ) {
    return await this.ordersService.updateOrderStatus(data);
  }

  @MessagePattern({ cmd: 'orders.findUserOrdersByPeriod' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findUserOrdersByPeriod(@Payload() dto: FindUserOrdersByPeriodDto) {
    return await this.ordersService.findUserOrdersByPeriod(dto.users);
  }
}
