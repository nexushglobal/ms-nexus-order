import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'src/common/helpers/paginate.helper';
import { PaymentService } from 'src/common/services/payment.service';
import { ProductStockHistory } from 'src/products/entities/product-stock-history.entity';
import { Product, ProductStatus } from 'src/products/entities/products.entity';
import { StockActionType } from 'src/products/enums/stock-action-type.enum';
import { DataSource, In, Repository } from 'typeorm';
import { CreateOrderDto, PaymentMethod } from './dto/create-order.dto';
import { FindAllOrdersAdminDto } from './dto/find-all-orders-admin.dto';
import { FindAllOrdersClientDto } from './dto/find-all-orders-client.dto';
import { OrdersDetails } from './entities/orders-details.entity';
import { OrderHistory } from './entities/orders-history.entity';
import { Order } from './entities/orders.entity';
import { OrderAction } from './enums/orders-action.enum';
import { OrderStatus } from './enums/orders-status.enum';
import { StockAction } from './enums/stock-action.enum';
import { formatOrderOneResponse } from './helpers/format-order-one-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrdersDetails)
    private readonly ordersDetailsRepository: Repository<OrdersDetails>,
    @InjectRepository(OrderHistory)
    private readonly orderHistoryRepository: Repository<OrderHistory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductStockHistory)
    private readonly productStockHistoryRepository: Repository<ProductStockHistory>,
    private readonly paymentService: PaymentService,
    private readonly dataSource: DataSource,
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

  async createOrder(payload: {
    userId: string;
    dto: CreateOrderDto;
    files?: any[];
  }) {
    return await this.dataSource.transaction(async (transactionManager) => {
      try {
        const { dto, files } = payload;

        // 1. Validaciones básicas
        if (!dto.userEmail) {
          throw new RpcException({
            status: HttpStatus.BAD_REQUEST,
            message: 'Email del usuario requerido',
          });
        }

        if (!dto.items || dto.items.length === 0) {
          throw new RpcException({
            status: HttpStatus.BAD_REQUEST,
            message: 'Debe incluir al menos un producto en la orden',
          });
        }

        // 2. Validar productos y obtener información
        const productIds = dto.items.map((item) => item.productId);
        const products = await transactionManager.find(Product, {
          where: {
            id: In(productIds),
            isActive: true,
          },
        });

        if (products.length !== productIds.length) {
          const foundIds = products.map((p) => p.id);
          const missingIds = productIds.filter((id) => !foundIds.includes(id));
          throw new RpcException({
            status: HttpStatus.BAD_REQUEST,
            message: `Productos no encontrados o inactivos: ${missingIds.join(', ')}. Productos solicitados: [${productIds.join(', ')}]. Productos encontrados: [${foundIds.join(', ')}]`,
          });
        }

        // 3. Solo validar que los productos existan
        for (const item of dto.items) {
          const product = products.find((p) => p.id === item.productId);
          if (!product) {
            throw new RpcException({
              status: HttpStatus.BAD_REQUEST,
              message: `Producto con ID ${item.productId} no encontrado`,
            });
          }
        }

        // 4. Calcular precios y totales
        let totalAmount = 0;
        const orderItemsWithPrices = dto.items.map((item) => {
          const product = products.find((p) => p.id === item.productId)!;
          const price = product.memberPrice;
          const itemTotal = price * item.quantity;
          totalAmount += itemTotal;
          return {
            product,
            quantity: item.quantity,
            price,
            total: itemTotal,
          };
        });

        const totalItems = dto.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );

        // 5. Validar que el totalAmount coincide con el calculado
        if (dto.totalAmount && Math.abs(dto.totalAmount - totalAmount) > 0.01) {
          throw new RpcException({
            status: HttpStatus.BAD_REQUEST,
            message: `El monto total proporcionado (${dto.totalAmount}) no coincide con el monto calculado (${totalAmount})`,
          });
        }

        // 6. Crear la orden en estado PENDING dentro de la transacción
        const order = transactionManager.create(Order, {
          userId: dto.userId,
          userEmail: dto.userEmail,
          userName: dto.userName,
          totalAmount,
          totalItems,
          status: OrderStatus.PENDING,
          metadata: {
            productos: orderItemsWithPrices.map((item) => ({
              SKU: item.product.id,
              Nombre: item.product.name,
              Cantidad: item.quantity,
              Precio: item.price,
            })),
          },
        });

        const savedOrder = await transactionManager.save(Order, order);

        // 7. Crear OrdersDetails dentro de la transacción
        const orderDetails = orderItemsWithPrices.map((item) =>
          transactionManager.create(OrdersDetails, {
            order: savedOrder,
            product: item.product,
            quantity: item.quantity,
            price: item.price,
          }),
        );

        await transactionManager.save(OrdersDetails, orderDetails);

        // 8. Crear registro de historial dentro de la transacción
        const historyRecord = transactionManager.create(OrderHistory, {
          order: savedOrder,
          userId: savedOrder.userId,
          userEmail: savedOrder.userEmail,
          userName: savedOrder.userName,
          action: OrderAction.CREATED,
          changes: { items: dto.items, totalAmount, totalItems },
          notes: 'Orden creada exitosamente',
          metadata: { paymentMethod: dto.paymentMethod },
        });

        await transactionManager.save(OrderHistory, historyRecord);

        // 9. Llamar al servicio de payment - SI ESTO FALLA, LA TRANSACCIÓN SE REVIERTE
        const paymentResult = await this.paymentService.createPayment({
          userId: dto.userId,
          userEmail: dto.userEmail,
          username: dto.userName || 'Usuario',
          paymentConfig: 'ORDER_PAYMENT',
          amount: totalAmount,
          status: 'PENDING',
          paymentMethod: dto.paymentMethod,
          relatedEntityType: 'ORDER',
          relatedEntityId: savedOrder.id,
          metadata: {
            orderId: savedOrder.id,
            totalItems,
            products: orderItemsWithPrices.map((item) => ({
              productId: item.product.id,
              productName: item.product.name,
              quantity: item.quantity,
              price: item.price,
            })),
          },
          payments: dto.payments || [],
          files: files || [],
          source_id: dto.source_id || '',
        });

        // 10. Verificar que el pago se creó correctamente
        if (!paymentResult || !paymentResult.id) {
          throw new RpcException({
            status: HttpStatus.BAD_REQUEST,
            message: 'Error creando el pago. Transacción cancelada.',
          });
        }

        // 11. Si es pago con puntos y fue exitoso, actualizar el status
        let finalStatus = OrderStatus.PENDING;
        let finalMessage =
          'Orden creada exitosamente, pendiente de aprobación de pago';

        if (
          dto.paymentMethod === PaymentMethod.POINTS &&
          paymentResult.success
        ) {
          // Actualizar la orden dentro de la transacción
          savedOrder.status = OrderStatus.APPROVED;
          await transactionManager.save(Order, savedOrder);

          // Crear historial de aprobación dentro de la transacción
          const approvalHistoryRecord = transactionManager.create(
            OrderHistory,
            {
              order: savedOrder,
              userId: savedOrder.userId,
              userEmail: savedOrder.userEmail,
              userName: savedOrder.userName,
              action: OrderAction.APPROVED,
              changes: { paymentId: paymentResult.id },
              notes: 'Orden aprobada automáticamente por pago con puntos',
              metadata: {},
            },
          );

          await transactionManager.save(OrderHistory, approvalHistoryRecord);

          finalStatus = OrderStatus.APPROVED;
          finalMessage = 'Orden creada y aprobada automáticamente con puntos';
        }

        // 12. Si llegamos aquí, todo fue exitoso
        return {
          orderId: savedOrder.id,
          paymentId: paymentResult.id,
          totalAmount,
          order: {
            totalItems,
            items: orderItemsWithPrices.map((item) => ({
              productId: item.product.id,
              name: item.product.name,
              quantity: item.quantity,
            })),
          },
          status: finalStatus,
          message: finalMessage,
        };
      } catch (error) {
        // Si hay cualquier error, la transacción se revierte automáticamente
        throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Error creando orden: ${error.message}`,
        });
      }
    });
  }

  // Métodos internos llamados solo desde PaymentService
  async updateOrderStatus(data: {
    orderId: number;
    status: OrderStatus;
    paymentId?: number;
    rejectionReason?: string;
  }) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: data.orderId },
        relations: ['orderDetails', 'orderDetails.product'],
      });

      if (!order) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Orden con ID ${data.orderId} no encontrada`,
        });
      }

      // Actualizar status de la orden
      order.status = data.status as any;

      if (data.status === OrderStatus.APPROVED) {
        // Lógica adicional para aprobación si es necesaria
        order.metadata = {
          ...order.metadata,
          paymentId: data.paymentId,
          approvedAt: new Date(),
        };
      } else if (data.status === OrderStatus.REJECTED) {
        order.metadata = {
          ...order.metadata,
          paymentId: data.paymentId,
          rejectionReason: data.rejectionReason,
          rejectedAt: new Date(),
        };
      }

      const updatedOrder = await this.orderRepository.save(order);

      // Crear registro de historial
      if (data.status === OrderStatus.APPROVED) {
        await this.createOrderHistoryRecord(
          updatedOrder,
          OrderAction.APPROVED,
          {
            previousStatus: 'PENDING',
            newStatus: data.status,
            paymentId: data.paymentId,
          },
          'Orden aprobada - Pago confirmado',
          { paymentId: data.paymentId, approvedAt: new Date() },
        );
      } else if (data.status === OrderStatus.REJECTED) {
        await this.createOrderHistoryRecord(
          updatedOrder,
          OrderAction.REJECTED,
          {
            previousStatus: 'PENDING',
            newStatus: data.status,
            paymentId: data.paymentId,
          },
          `Orden rechazada: ${data.rejectionReason}`,
          {
            paymentId: data.paymentId,
            rejectionReason: data.rejectionReason,
            rejectedAt: new Date(),
          },
        );
      }

      return {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        totalAmount: updatedOrder.totalAmount,
        totalItems: updatedOrder.totalItems,
        products:
          updatedOrder.orderDetails?.map((detail) => ({
            productId: detail.product.id,
            productName: detail.product.name,
            quantity: detail.quantity,
            price: detail.price,
          })) || [],
        binaryPoints:
          data.status === OrderStatus.APPROVED
            ? updatedOrder.totalAmount * 0.1
            : 0,
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error actualizando status de orden: ${error.message}`,
      });
    }
  }

  async processStockUpdate(data: { orderId: number; action: StockAction }) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: data.orderId },
        relations: ['orderDetails', 'orderDetails.product'],
      });

      if (!order) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Orden con ID ${data.orderId} no encontrada`,
        });
      }

      const stockUpdates: Array<{
        productId: number;
        quantity: number;
        action: string;
      }> = [];

      for (const detail of order.orderDetails || []) {
        const product = detail.product;
        const quantity = detail.quantity;

        switch (data.action) {
          case StockAction.RESERVE:
            // Verificar que aún hay stock disponible antes de reservar (como monolítico)
            if (product.stock < quantity) {
              throw new RpcException({
                status: HttpStatus.BAD_REQUEST,
                message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, requerido: ${quantity}`,
              });
            }

            // Descontar stock temporalmente
            product.stock -= quantity;
            await this.productRepository.save(product);

            stockUpdates.push({
              productId: product.id,
              quantity: -quantity,
              action: 'RESERVED',
            });
            break;

          case StockAction.CONFIRM:
            stockUpdates.push({
              productId: product.id,
              quantity: 0, // Ya fue descontado
              action: 'CONFIRMED',
            });
            break;

          case StockAction.RELEASE:
            // Devolver el stock reservado
            product.stock += quantity;
            await this.productRepository.save(product);

            stockUpdates.push({
              productId: product.id,
              quantity: +quantity,
              action: 'RELEASED',
            });
            break;

          default:
            throw new RpcException({
              status: HttpStatus.BAD_REQUEST,
              message: `Acción de stock no válida: ${data.action as any}`,
            });
        }

        // Actualizar status del producto si se queda sin stock
        if (product.stock === 0 && product.status === ProductStatus.ACTIVE) {
          product.status = ProductStatus.OUT_OF_STOCK as any;
          await this.productRepository.save(product);
        } else if (
          product.stock > 0 &&
          product.status === ProductStatus.OUT_OF_STOCK
        ) {
          product.status = 'ACTIVE' as any;
          await this.productRepository.save(product);
        }
      }

      // Crear ProductStockHistory records para auditoría
      for (const update of stockUpdates) {
        const product = await this.productRepository.findOne({
          where: { id: update.productId },
        });
        if (product) {
          const previousQuantity =
            update.action === 'RESERVED'
              ? product.stock + Math.abs(update.quantity)
              : update.action === 'RELEASED'
                ? product.stock - update.quantity
                : product.stock;

          await this.createProductStockHistoryRecord(
            product,
            previousQuantity,
            product.stock,
            update.quantity,
            update.action === 'RESERVED'
              ? StockActionType.DECREASE
              : update.action === 'RELEASED'
                ? StockActionType.INCREASE
                : StockActionType.UPDATE,
            `Stock ${update.action.toLowerCase()} for order ${data.orderId}`,
            order.userId,
            order.userEmail,
            order.userName,
          );
        }
      }

      return {
        success: true,
        action: data.action,
        orderId: data.orderId,
        stockUpdates,
        message: `Stock ${data.action.toLowerCase()} procesado correctamente`,
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error procesando stock: ${error.message}`,
      });
    }
  }

  private async createOrderHistoryRecord(
    order: Order,
    action: OrderAction,
    changes: Record<string, any> = {},
    notes?: string,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      const historyRecord = this.orderHistoryRepository.create({
        order,
        userId: order.userId,
        userEmail: order.userEmail,
        userName: order.userName,
        action,
        changes,
        notes,
        metadata,
      });

      await this.orderHistoryRepository.save(historyRecord);
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error creando registro de historial para orden ${order.id}: ${error.message}`,
      });
    }
  }

  private async createProductStockHistoryRecord(
    product: Product,
    previousQuantity: number,
    newQuantity: number,
    quantityChanged: number,
    actionType: StockActionType,
    notes: string,
    userId: string,
    userEmail: string,
    userName?: string,
  ): Promise<void> {
    try {
      const historyRecord = this.productStockHistoryRepository.create({
        product,
        previousQuantity,
        newQuantity,
        quantityChanged,
        actionType,
        notes,
        userId,
        userEmail,
        userName,
      });

      await this.productStockHistoryRepository.save(historyRecord);
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error creando registro de historial de stock para producto ${product.id}: ${error.message}`,
      });
    }
  }

  async markOrderAsSent(orderId: number): Promise<any> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['orderDetails', 'orderDetails.product'],
      });

      if (!order) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Orden con ID ${orderId} no encontrada`,
        });
      }

      if (order.status !== OrderStatus.APPROVED) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message:
            'La orden debe estar aprobada para poder marcarla como enviada',
        });
      }

      // Validar y actualizar stock de cada producto (AQUÍ es donde se resta)
      for (const detail of order.orderDetails || []) {
        const product = detail.product;
        const quantityToSubtract = detail.quantity;

        if (!product) {
          throw new RpcException({
            status: HttpStatus.NOT_FOUND,
            message: `Producto no encontrado`,
          });
        }

        if (product.stock < quantityToSubtract) {
          throw new RpcException({
            status: HttpStatus.BAD_REQUEST,
            message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, requerido: ${quantityToSubtract}`,
          });
        }

        // Crear registro de historial de stock ANTES de actualizar
        await this.createProductStockHistoryRecord(
          product,
          product.stock, // cantidad anterior
          product.stock - quantityToSubtract, // cantidad nueva
          -quantityToSubtract, // cantidad cambiada (negativa)
          StockActionType.DECREASE,
          `Stock descontado por envío de orden ${orderId}`,
          order.userId,
          order.userEmail,
          order.userName,
        );

        // ACTUALIZAR STOCK DEL PRODUCTO
        product.stock -= quantityToSubtract;
        await this.productRepository.save(product);

        // Actualizar status del producto si se queda sin stock
        if (product.stock === 0 && product.status === ProductStatus.ACTIVE) {
          product.status = ProductStatus.OUT_OF_STOCK;
          await this.productRepository.save(product);
        }
      }

      order.status = OrderStatus.SENT;
      await this.orderRepository.save(order);

      await this.createOrderHistoryRecord(
        order,
        OrderAction.SENT,
        { previousStatus: OrderStatus.APPROVED, newStatus: OrderStatus.SENT },
        'Orden enviada - Stock descontado',
        { sentAt: new Date() },
      );
      return {
        success: true,
        orderId: orderId,
        status: 'SENT',
        message: 'Orden marcada como enviada exitosamente',
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error al marcar orden ${orderId} como enviada: ${error.message}`,
      });
    }
  }
}
