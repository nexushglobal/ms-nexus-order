import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RemoveBenefitDto {
  @IsNumber({}, { message: 'El ID del producto debe ser un número' })
  @IsNotEmpty({ message: 'El ID del producto es requerido' })
  productId: number;

  @IsString({ message: 'El beneficio debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El beneficio es requerido' })
  @Transform(({ value }) => value?.trim())
  benefit: string;
}
