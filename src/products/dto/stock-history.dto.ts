import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { StockActionType } from '../enums/stock-action-type.enum';

export class StockHistoryDto {
  @IsString({ message: 'El id del usuario es obligatorio' })
  @IsNotEmpty({ message: 'El id del usuario es obligatorio' })
  userId: string;

  @IsNumber({}, { message: 'El id del producto es numérico' })
  @IsNotEmpty({ message: 'El id del producto es obligatorio' })
  productId: number;

  @IsEnum(StockActionType, {
    message: 'El tipo de acción debe ser válido (INCREASE, DECREASE, UPDATE)',
  })
  actionType: StockActionType;

  @IsNumber()
  @Min(0, { message: 'La cantidad nueva no puede ser negativa' })
  quantity: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'La cantidad modificada es numérica' })
  quantityChanged?: number;

  @IsOptional()
  @IsString({ message: 'La nota es una cadena de texto' })
  notes?: string;
}
