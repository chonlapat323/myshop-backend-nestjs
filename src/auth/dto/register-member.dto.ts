import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterMemberDto {
  @IsNotEmpty()
  first_name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}
