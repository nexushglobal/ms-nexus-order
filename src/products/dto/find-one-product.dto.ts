import { IsNotEmpty, IsNumber } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FindOneProductClientDto extends PaginationDto {
  @IsNotEmpty()
  @IsNumber()
  id: string;
}

export class FindOneProductResponseDto {
  id: number;
  name: string;
  sku: string;
  description: string;
  composition?: string;
  memberPrice: number;
  publicPrice: number;
  stock: number;
  isActive: boolean;
  category: {
    id: number;
    name: string;
    code: string;
  } | null;
  benefits: string[];
  imagesCount: number;
  images: ProductImageResponseDto[];
}

export class ProductImageResponseDto {
  id: number;
  url: string;
  isMain: boolean;
  order: number;
}
