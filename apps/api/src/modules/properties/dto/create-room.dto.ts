import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { RoomStatus } from '@prisma/client';

export class CreateRoomDto {
  @ApiProperty({ example: '101', description: 'Nomor atau nama unit kamar' })
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @ApiProperty({ example: 1800000, description: 'Harga sewa bulanan dalam Rupiah' })
  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @ApiPropertyOptional({ enum: RoomStatus, default: RoomStatus.AVAILABLE, description: 'Status kamar saat ini' })
  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;

  @ApiPropertyOptional({ example: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam'], description: 'Daftar fasilitas unit kamar' })
  @IsArray()
  @IsOptional()
  facilities?: string[];
}

