import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';

export class CreatePaymentMethodDto {
  @IsNotEmpty()
  @IsString()
  cardholder_name: string;

  @IsNotEmpty()
  @Matches(/^\d{16}$/, { message: 'Card number must be 16 digits' })
  card_number: string;

  @IsNotEmpty()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'Expiry date must be in MM/YY format',
  })
  expiry_date: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
