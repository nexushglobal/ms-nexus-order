import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ExcelStockUpdateDto {
  @IsNumber({}, { message: 'El id del producto es numérico' })
  @IsNotEmpty({ message: 'El id del producto es obligatorio' })
  productId: number;

  @IsString({ message: 'El nombre del producto es obligatorio' })
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  productName: string;

  @IsNumber({}, { message: 'La nueva cantidad es numérica' })
  @IsNotEmpty({ message: 'La nueva cantidad es obligatoria' })
  newQuantity: number;
}
