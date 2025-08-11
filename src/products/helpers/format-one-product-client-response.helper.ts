import { FindOneProductClientResponseDto } from '../dto/find-one-product-client.dto';
import { Product } from '../entities/products.entity';

export const formatOneProducClientResponse = (
  product: Product,
): FindOneProductClientResponseDto => {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    composition: product.composition,
    sku: product.sku,
    price: product.memberPrice,
    priceOff: product.publicPrice,
    isActive: product.isActive,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          code: product.category.code,
        }
      : null,
    benefits: product.benefits,
    images: product.images?.map((img) => ({
      id: img.id,
      url: img.url,
      isMain: img.isMain,
      order: img.order,
    })),
  };
};
