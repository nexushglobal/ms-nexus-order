import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UserPeriodOrderDto {
  @IsString()
  userId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class FindUserOrdersByPeriodDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserPeriodOrderDto)
  users: UserPeriodOrderDto[];
}

export class UserOrderSummaryDto {
  userId: string;
  totalAmount: number;
  orderCount: number;
  meetsMinimumAmount: boolean;
}

export class FindUserOrdersByPeriodResponseDto {
  usersOrdersSummary: UserOrderSummaryDto[];
  totalUsersProcessed: number;
}
