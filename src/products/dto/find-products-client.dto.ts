import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FindProductsClientDto extends PaginationDto {
  @IsString()
  @IsNotEmpty({ message: 'El id del usuario es requerido' })
  userId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  categoryId?: number;
}

export class FindProductsClientResponseDto {
  id: number;
  name: string;
  sku: string;
  price: number;
  priceOff: number | null;
  category: {
    id: number;
    name: string;
    code: string;
  } | null;
  mainImage: string | null;
}
