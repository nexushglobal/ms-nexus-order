import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ExcelStockUpdateDto } from './excel-stock-update.dto';

export class BulkCreateStockDto {
  @IsString({ message: 'El id del usuario es obligatorio' })
  @IsNotEmpty({ message: 'El id del usuario es obligatorio' })
  userId: string;

  @IsNotEmpty({ message: 'El archivo es requerido' })
  @IsArray({ message: 'Los productos deben estar en un arreglo' })
  @ArrayNotEmpty({ message: 'Debe proporcionar al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => ExcelStockUpdateDto)
  products: ExcelStockUpdateDto[];
}

export class BulkCreateStockResponseDto {
  productId: number;
  productName: string;
  previousStock: number;
  newStock: number;
  changedStock: number;
}
