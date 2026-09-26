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
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomStatus } from '@prisma/client';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // ===================== PROPERTY ENDPOINTS =====================

  @Get()
  @ApiOperation({ summary: 'Daftar semua properti kos beserta ringkasan kamar' })
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get('rooms/all')
  @ApiOperation({ summary: 'Daftar semua kamar (bisa filter berdasarkan propertyId atau status)' })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: RoomStatus })
  findAllRooms(
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: RoomStatus,
  ) {
    return this.propertiesService.findAllRooms(propertyId, status);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Detail kamar beserta tenant aktif' })
  findRoom(@Param('id') id: string) {
    return this.propertiesService.findRoom(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail properti beserta semua unit kamar' })
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tambah properti baru' })
  create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update info properti' })
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus properti' })
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }

  // ===================== ROOM ENDPOINTS =====================

  @Post(':propertyId/rooms')
  @ApiOperation({ summary: 'Tambah kamar ke properti tertentu' })
  createRoom(
    @Param('propertyId') propertyId: string,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    return this.propertiesService.createRoom(propertyId, createRoomDto);
  }

  @Patch('rooms/:id')
  @ApiOperation({ summary: 'Update kamar (nomor, harga bulanan, status)' })
  updateRoom(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.propertiesService.updateRoom(id, updateRoomDto);
  }

  @Patch('rooms/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle status kamar: AVAILABLE <-> OCCUPIED' })
  toggleRoomStatus(@Param('id') id: string) {
    return this.propertiesService.toggleRoomStatus(id);
  }

  @Delete('rooms/:id')
  @ApiOperation({ summary: 'Hapus kamar' })
  removeRoom(@Param('id') id: string) {
    return this.propertiesService.removeRoom(id);
  }
}
