import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceStatus } from '@prisma/client';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar semua tagihan sewa (bisa filter ?status=UNPAID untuk n8n cron check)' })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  findAll(@Query('status') status?: InvoiceStatus) {
    return this.invoicesService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail tagihan sewa beserta info tenant & kamar' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat tagihan sewa baru' })
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update info/status tagihan' })
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus tagihan' })
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}
