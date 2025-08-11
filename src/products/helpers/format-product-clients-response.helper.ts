import { FindProductsClientResponseDto } from '../dto/find-products-client.dto';
import { Product } from '../entities/products.entity';

export const formatProductClientsResponse = (
  product: Product,
): FindProductsClientResponseDto => {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          code: product.category.code,
        }
      : null,
    price: product.memberPrice,
    priceOff: product.publicPrice,
  };
};
