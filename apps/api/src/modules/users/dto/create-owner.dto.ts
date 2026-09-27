import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOwnerDto {
  @ApiProperty({ example: 'H. Rahmat Santoso', description: 'Nama lengkap pemilik kos' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'rahmat@kosconnect.id', description: 'Email resmi pemilik kos' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '081298765432', description: 'Nomor WhatsApp pemilik kos' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Harmoni2026!', description: 'Password sementara (opsional, auto-generate jika kosong)', required: false })
  @IsString()
  @IsOptional()
  initialPassword?: string;
}
