import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export enum PaymentMethod {
  VOUCHER = 'VOUCHER',
  POINTS = 'POINTS',
  PAYMENT_GATEWAY = 'PAYMENT_GATEWAY',
}

export class OrderItemDto {
  @IsNumber()
  @Min(1)
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class PaymentDetailDto {
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsString()
  @IsNotEmpty()
  transactionReference: string;

  @IsString()
  @IsNotEmpty()
  transactionDate: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNumber()
  @Min(0)
  fileIndex: number;
}

export class CreateOrderDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  userEmail: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  totalAmount?: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;

  // Para método VOUCHER
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDetailDto)
  payments?: PaymentDetailDto[];

  // Para método PAYMENT_GATEWAY
  @IsOptional()
  @IsString()
  source_id?: string;
}

export class CreateOrderPayload {
  createDto: CreateOrderDto;
  files?: Array<{
    originalname: string;
    buffer: Buffer;
    mimetype: string;
    size: number;
  }>;
}
