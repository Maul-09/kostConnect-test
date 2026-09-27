import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Kos Harmoni Residence', description: 'Nama properti / kos' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Jl. Kemang Raya No. 45', description: 'Alamat lengkap properti' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Jakarta Selatan', description: 'Kota lokasi properti' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'uuid-pemilik-kos', description: 'ID user pemilik kos (dari dropdown)', required: false })
  @IsString()
  @IsOptional()
  ownerId?: string;
}
