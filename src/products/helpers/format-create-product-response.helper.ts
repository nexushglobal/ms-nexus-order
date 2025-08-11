import { CreateProductResponseDto } from '../dto/create-product.dto';
import { Product } from '../entities/products.entity';

export const formatCreateProductResponse = (
  product: Product,
): CreateProductResponseDto => {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    stock: product.stock,
    status: product.status,
    memberPrice: product.memberPrice,
    publicPrice: product.publicPrice,
    images: product.images
      ? product.images.map((img) => ({
          id: img.id,
          url: img.url,
          isMain: img.isMain,
        }))
      : [],
  };
};
