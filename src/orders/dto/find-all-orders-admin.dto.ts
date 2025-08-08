import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { OrderStatus } from '../enums/orders-status.enum';

export class FindAllOrdersAdminDto extends PaginationDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  term?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
