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
    mainImage:
      product.images && product.images.length > 0
        ? product.images.find((img) => img.isMain)?.url || product.images[0].url
        : null,
  };
};
