import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'rahmat@kosconnect.id', description: 'Email user yang akan mengganti password' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456789', description: 'Password sementara saat ini (1 sampai 9)' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: 'RahasiaBaru2026#',
    description: 'Password baru yang aman (min 8 karakter, huruf besar, huruf kecil, angka, simbol)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password baru minimal harus 8 karakter' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
    message: 'Password baru wajib mengandung huruf besar (A-Z), huruf kecil (a-z), angka (0-9), dan simbol khusus (!@#$%)',
  })
  newPassword: string;
}

