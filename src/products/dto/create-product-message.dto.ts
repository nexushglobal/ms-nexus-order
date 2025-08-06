import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class CreateProductMessageDto {
  @ValidateNested()
  @Type(() => CreateProductDto)
  @IsNotEmpty({ message: 'Los datos del producto son requeridos' })
  createProductDto: CreateProductDto;

  @IsArray({ message: 'Los archivos deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => FileMessageDto)
  files: FileMessageDto[];

  @IsString({ message: 'El ID del usuario debe ser una cadena' })
  @IsNotEmpty({ message: 'El ID del usuario es requerido' })
  userId: string;
}

export class FileMessageDto {
  @Transform(({ value }) => Buffer.from(value, 'base64'))
  @IsNotEmpty({ message: 'El buffer del archivo es requerido' })
  buffer: Buffer;

  @IsString({ message: 'El nombre original debe ser una cadena' })
  @IsNotEmpty({ message: 'El nombre original es requerido' })
  originalname: string;

  @IsString({ message: 'El mimetype debe ser una cadena' })
  @IsNotEmpty({ message: 'El mimetype es requerido' })
  mimetype: string;

  @IsNumber({}, { message: 'El tamaño debe ser un número' })
  @IsNotEmpty({ message: 'El tamaño del archivo es requerido' })
  size: number;

  @IsOptional()
  @IsString()
  fieldname?: string;

  @IsOptional()
  @IsString()
  encoding?: string;
}
