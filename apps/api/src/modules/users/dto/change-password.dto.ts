import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'rahmat@kosconnect.id', description: 'Email user yang akan mengganti password' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Harmoni2026!', description: 'Password sementara saat ini' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'RahasiaBaru2026#', description: 'Password baru yang aman' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
