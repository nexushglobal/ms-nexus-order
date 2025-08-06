import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { FileDto } from './file.dto';

export class UpdateImageDto {
  @IsOptional()
  @IsBoolean({ message: 'El valor de isMain debe ser booleano' })
  isMain?: boolean;

  @IsOptional()
  @IsInt({ message: 'El orden debe ser un número entero' })
  order?: number;
}

export class UpdateProductImageMessageDto {
  @IsNotEmpty({ message: 'El ID del producto es requerido' })
  @IsNumber({}, { message: 'El ID del producto debe ser numérico' })
  productId: number;

  @IsNotEmpty({ message: 'El ID de la imagen es requerido' })
  @IsNumber({}, { message: 'El ID de la imagen debe ser numérico' })
  imageId: number;

  @IsNotEmpty({ message: 'Los datos a actualizar de la imagen son requeridos' })
  @ValidateNested()
  @Type(() => UpdateImageDto)
  updateImageDto: UpdateImageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FileDto)
  file?: FileDto;
}
