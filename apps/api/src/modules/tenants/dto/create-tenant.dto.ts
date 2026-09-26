import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Budi Santoso', description: 'Nama lengkap penyewa' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'budi.santoso@example.com', description: 'Email aktif penyewa (unik)' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '081234567890', description: 'Nomor WhatsApp / telepon' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
