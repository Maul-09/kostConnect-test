import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateContractDto {
  @ApiProperty({ example: 'uuid-kamar', description: 'ID kamar yang akan disewa' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ example: 'uuid-tenant', description: 'ID penyewa yang menyewa' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z', description: 'Tanggal mulai sewa' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2027-04-01T00:00:00.000Z', description: 'Tanggal berakhir sewa' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
