import { FindOneProductResponseDto } from '../dto/find-one-product.dto';
import { Product } from '../entities/products.entity';

export const formatOneProductResponse = (
  product: Product,
): FindOneProductResponseDto => {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    composition: product.composition,
    sku: product.sku,
    memberPrice: product.memberPrice,
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
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      isMain: img.isMain,
      order: img.order,
    })),
  };
};
