import { FindProductsResponseDto } from '../dto/find-products.dto';
import { Product } from '../entities/products.entity';

export const formatProductResponse = (
  product: Product,
): FindProductsResponseDto => {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    composition: product.composition,
    sku: product.sku,
    memberPrice: product.memberPrice,
    status: product.status,
    publicPrice: product.publicPrice,
    stock: product.stock,
    isActive: product.isActive,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          code: product.category.code,
        }
      : null,
    benefits: product.benefits,
    imagesCount: product.images ? product.images.length : 0,
    mainImage:
      product.images && product.images.length > 0
        ? product.images.find((img) => img.isMain)?.url || product.images[0].url
        : null,
  };
};
