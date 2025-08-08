import { Order } from '../entities/orders.entity';

export const formatOrderOneResponse = (order: Order) => {
  return {
    id: order.id,
    userId: order.userId,
    userEmail: order.userEmail,
    userName: order.userName,
    status: order.status,
    totalAmount: order.totalAmount,
    totalItems: order.totalItems,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    orderDetails: order.orderDetails.map((detail) => ({
      id: detail.id,
      productId: detail.product.id,
      productName: detail.product.name,
      productImage:
        detail.product.images && detail.product.images.length > 0
          ? detail.product.images.find((img) => img.isMain)?.url ||
            detail.product.images[0].url
          : null,
      quantity: detail.quantity,
      price: detail.price,
    })),
    orderHistory: order.orderHistory,
  };
};
