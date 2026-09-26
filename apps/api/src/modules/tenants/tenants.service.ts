import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { RoomStatus } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===================== TENANT SERVICES =====================

  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        contracts: {
          include: {
            room: {
              include: { property: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { contracts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        contracts: {
          include: {
            room: {
              include: { property: true },
            },
            invoices: {
              orderBy: { dueDate: 'asc' },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async create(createTenantDto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { email: createTenantDto.email },
    });

    if (existing) {
      throw new ConflictException(`Tenant with email ${createTenantDto.email} already exists`);
    }

    return this.prisma.tenant.create({
      data: createTenantDto,
    });
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  // ===================== CONTRACT SERVICES =====================

  async findAllContracts(isActive?: boolean) {
    return this.prisma.contract.findMany({
      where: {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      },
      include: {
        tenant: true,
        room: {
          include: { property: true },
        },
        invoices: {
          orderBy: { dueDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findContract(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        tenant: true,
        room: {
          include: { property: true },
        },
        invoices: {
          orderBy: { dueDate: 'desc' },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  async createContract(createContractDto: CreateContractDto) {
    const { roomId, tenantId, startDate, endDate } = createContractDto;

    // 1. Verifikasi Room
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    if (room.status === RoomStatus.OCCUPIED) {
      throw new ConflictException(`Room ${room.roomNumber} is currently OCCUPIED`);
    }

    // 2. Verifikasi Tenant
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // 3. Eksekusi Transaksi: Buat Kontrak & Otomatis ubah status kamar menjadi OCCUPIED
    const [contract] = await this.prisma.$transaction([
      this.prisma.contract.create({
        data: {
          roomId,
          tenantId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive: true,
        },
        include: {
          tenant: true,
          room: {
            include: { property: true },
          },
        },
      }),
      this.prisma.room.update({
        where: { id: roomId },
        data: { status: RoomStatus.OCCUPIED },
      }),
    ]);

    return contract;
  }

  async terminateContract(id: string) {
    const contract = await this.findContract(id);

    if (!contract.isActive) {
      throw new ConflictException(`Contract ${id} is already inactive`);
    }

    // Eksekusi Transaksi: Matikan kontrak & Otomatis kembalikan status kamar jadi AVAILABLE
    const [updatedContract] = await this.prisma.$transaction([
      this.prisma.contract.update({
        where: { id },
        data: { isActive: false },
        include: {
          tenant: true,
          room: true,
        },
      }),
      this.prisma.room.update({
        where: { id: contract.roomId },
        data: { status: RoomStatus.AVAILABLE },
      }),
    ]);

    return updatedContract;
  }
}
