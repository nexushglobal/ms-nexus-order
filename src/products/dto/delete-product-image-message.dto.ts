import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteProductImageMessageDto {
  @IsNotEmpty({ message: 'El ID del producto es requerido' })
  @IsNumber({}, { message: 'El ID del producto debe ser numérico' })
  productId: number;

  @IsNotEmpty({ message: 'El ID de la imagen es requerido' })
  @IsNumber({}, { message: 'El ID de la imagen debe ser numérico' })
  imageId: number;
}
