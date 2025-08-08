import {
  Controller,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FindAllOrdersAdminDto } from './dto/find-all-orders-admin.dto';
import { FindAllOrdersClientDto } from './dto/find-all-orders-client.dto';
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
}
