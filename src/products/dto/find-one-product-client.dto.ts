import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ProductImageResponseDto } from './find-one-product.dto';

export class FindOneProductClientDto extends PaginationDto {
  @IsString()
  @IsNotEmpty({ message: 'El id del usuario es requerido' })
  userId: string;

  @IsOptional()
  @IsNumber()
  id: string;
}

export class FindOneProductClientResponseDto {
  id: number;
  name: string;
  sku: string;
  description: string;
  composition?: string;
  price: number;
  priceOff: number | null;
  isActive: boolean;
  category: {
    id: number;
    name: string;
    code: string;
  } | null;
  benefits: string[];
  images: ProductImageResponseDto[] | null;
}
