import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { FileDto } from './file.dto'; // Ajusta la ruta según tu estructura

export class ValidateStockExcelMessageDto {
  @IsNotEmpty({ message: 'El archivo es requerido' })
  @ValidateNested()
  @Type(() => FileDto)
  file: FileDto;
}
