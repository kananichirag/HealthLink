import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Min } from 'class-validator';
import { PaymentType } from '@prisma/client';

export class CreatePaymentIntentDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/, { message: 'currency must be a valid ISO 4217 3-letter code' })
  currency: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsOptional()
  @IsUUID()
  orderId?: string;
}
