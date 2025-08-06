import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateInitialStockDto {
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(1, { message: 'El stock debe ser mayor a 0' })
  @Transform(({ value }) => parseInt(value))
  stock: number;

  @IsNotEmpty({ message: 'El ID de usuario es requerido' })
  userId: string;

  @IsNotEmpty({ message: 'El email de usuario es requerido' })
  userEmail: string;

  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  userName: string;
}
