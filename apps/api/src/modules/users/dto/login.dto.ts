import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'rahmat@kosconnect.id', description: 'Email akun' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Harmoni2026!', description: 'Password akun' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
