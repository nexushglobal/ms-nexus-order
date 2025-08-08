import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class AddBenefitDto {
  @IsNumber({}, { message: 'El ID del producto debe ser un número' })
  @IsNotEmpty({ message: 'El ID del producto es requerido' })
  productId: number;

  @IsString({ message: 'El beneficio debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El beneficio es requerido' })
  @MaxLength(200, {
    message: 'El beneficio no puede tener más de 200 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  benefit: string;
}

export class BenefitResponseDto {
  id: number;
  name: string;
  benefits: string[];
  message: string;
}
