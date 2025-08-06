import {
  IsInt,
  IsMimeType,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class FileDto {
  @IsOptional()
  @IsString()
  fieldname?: string;

  @IsNotEmpty({ message: 'El nombre original del archivo es requerido' })
  @IsString()
  originalname: string;

  @IsOptional()
  @IsString()
  encoding?: string;

  @IsNotEmpty({ message: 'El tipo MIME es requerido' })
  @IsMimeType({ message: 'El tipo MIME no es válido' })
  mimetype: string;

  @IsNotEmpty({ message: 'El tamaño del archivo es requerido' })
  @IsInt({ message: 'El tamaño debe ser un número entero' })
  size: number;

  @IsNotEmpty({ message: 'El buffer del archivo es requerido' })
  buffer: Buffer;
}
