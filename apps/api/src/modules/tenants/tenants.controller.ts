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
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateContractDto } from './dto/create-contract.dto';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ===================== TENANT ENDPOINTS =====================

  @Get()
  @ApiOperation({ summary: 'Daftar semua penyewa (tenant) beserta riwayat sewa' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get('contracts/all')
  @ApiOperation({ summary: 'Daftar semua kontrak sewa (bisa filter isActive=true/false)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAllContracts(@Query('isActive') isActive?: string) {
    const activeBool = isActive !== undefined ? isActive === 'true' : undefined;
    return this.tenantsService.findAllContracts(activeBool);
  }

  @Get('contracts/:id')
  @ApiOperation({ summary: 'Detail kontrak sewa beserta kamar, tenant, dan invoice' })
  findContract(@Param('id') id: string) {
    return this.tenantsService.findContract(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail penyewa (tenant)' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Daftarkan penyewa baru' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update info penyewa' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus data penyewa' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }

  // ===================== CONTRACT ENDPOINTS =====================

  @Post('contracts')
  @ApiOperation({ summary: 'Buat kontrak sewa baru (Otomatis mengubah status kamar menjadi OCCUPIED)' })
  createContract(@Body() createContractDto: CreateContractDto) {
    return this.tenantsService.createContract(createContractDto);
  }

  @Patch('contracts/:id/terminate')
  @ApiOperation({ summary: 'Akhiri kontrak sewa / Checkout (Otomatis mengubah status kamar kembali ke AVAILABLE)' })
  terminateContract(@Param('id') id: string) {
    return this.tenantsService.terminateContract(id);
  }
}
