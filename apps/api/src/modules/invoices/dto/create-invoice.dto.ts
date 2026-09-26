import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ example: 'uuid-kontrak', description: 'ID kontrak sewa terkait' })
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @ApiProperty({ example: 1800000, description: 'Nominal tagihan sewa (Rupiah)' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: '2026-10-05T00:00:00.000Z', description: 'Batas tanggal jatuh tempo pembayaran' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiPropertyOptional({ example: 'INV-202610-001', description: 'Nomor invoice khusus (opsional, auto-generate jika kosong)' })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;
}
