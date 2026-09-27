import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomStatus } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  // ===================== PROPERTY SERVICES =====================

  async findAll() {
    return this.prisma.property.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        rooms: {
          select: {
            id: true,
            roomNumber: true,
            monthlyPrice: true,
            status: true,
            facilities: true,
          },
        },
        _count: {
          select: { rooms: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        rooms: {
          include: {
            contracts: {
              where: { isActive: true },
              include: { tenant: true },
            },
          },
          orderBy: { roomNumber: 'asc' },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  async create(createPropertyDto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: createPropertyDto,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    await this.findOne(id);
    return this.prisma.property.update({
      where: { id },
      data: updatePropertyDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.property.delete({
      where: { id },
    });
  }

  // ===================== ROOM SERVICES =====================

  async findAllRooms(propertyId?: string, status?: RoomStatus) {
    return this.prisma.room.findMany({
      where: {
        ...(propertyId ? { propertyId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        property: true,
        contracts: {
          where: { isActive: true },
          include: { tenant: true },
        },
      },
      orderBy: { roomNumber: 'asc' },
    });
  }

  async findRoom(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        property: true,
        contracts: {
          where: { isActive: true },
          include: { tenant: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  async createRoom(propertyId: string, createRoomDto: CreateRoomDto) {
    await this.findOne(propertyId);
    return this.prisma.room.create({
      data: {
        propertyId,
        roomNumber: createRoomDto.roomNumber,
        monthlyPrice: createRoomDto.monthlyPrice,
        status: createRoomDto.status ?? RoomStatus.AVAILABLE,
        facilities: createRoomDto.facilities ?? [],
      },
    });
  }

  async updateRoom(id: string, updateRoomDto: UpdateRoomDto) {
    await this.findRoom(id);
    return this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
    });
  }

  async toggleRoomStatus(id: string) {
    const room = await this.findRoom(id);
    const newStatus =
      room.status === RoomStatus.AVAILABLE
        ? RoomStatus.OCCUPIED
        : RoomStatus.AVAILABLE;

    return this.prisma.room.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async removeRoom(id: string) {
    const room = await this.findRoom(id);
    if (room.contracts && room.contracts.some((c) => c.isActive)) {
      throw new BadRequestException('Kamar ini masih memiliki kontrak sewa yang aktif. Selesaikan kontrak sewa terlebih dahulu sebelum menghapus unit kamar.');
    }

    // Hapus relasi kontrak/invoice yang sudah tidak aktif bila ada
    await this.prisma.contract.deleteMany({
      where: { roomId: id },
    });

    return this.prisma.room.delete({
      where: { id },
    });
  }
}

