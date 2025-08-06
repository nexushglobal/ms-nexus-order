import { UpdateProductResponseDto } from '../dto/update-product.dto';
import { Product } from '../entities/products.entity';

export const formatUpdateProductResponse = (
  product: Product,
): UpdateProductResponseDto => {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    stock: product.stock,
    status: product.status,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
        }
      : null,
  };
};
