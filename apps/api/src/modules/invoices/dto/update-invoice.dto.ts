import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { InvoiceStatus } from '@prisma/client';

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ example: 1800000, description: 'Nominal tagihan sewa' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: '2026-10-05T00:00:00.000Z', description: 'Tanggal jatuh tempo' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ enum: InvoiceStatus, description: 'Status tagihan (UNPAID, PAID, CANCELLED)' })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;
}
