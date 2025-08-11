import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ProductImage } from '../entities/product-image.entity';

export class FindProductsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;
}

export class FindProductsResponseDto {
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
  mainImage: string | ProductImage[] | null;
}
