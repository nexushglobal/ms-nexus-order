import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { FileDto } from './file.dto';

export class AddProductImageMessageDto {
  @IsNotEmpty({ message: 'El ID del producto es requerido' })
  @IsNumber({}, { message: 'El ID del producto debe ser numérico' })
  productId: number;

  @IsNotEmpty({ message: 'El archivo es requerido' })
  @ValidateNested()
  @Type(() => FileDto)
  file: FileDto;
}
