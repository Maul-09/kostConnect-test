import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { RoomStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===================== TENANT SERVICES =====================

  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            mustChangePassword: true,
          },
        },
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
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            mustChangePassword: true,
          },
        },
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

    const temporaryPassword = '123456789';
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const tenant = await this.prisma.tenant.create({
      data: createTenantDto,
    });

    await this.prisma.user.create({
      data: {
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        password: hashedPassword,
        role: Role.TENANT,
        mustChangePassword: true,
        tenantId: tenant.id,
      },
    });

    return {
      ...tenant,
      temporaryPassword,
      message: 'Akun penyewa berhasil dibuat. Berikan password sementara kepada penyewa untuk login pertama kali.',
    };
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    await this.findOne(id);
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });

    // Sinkronisasi data ke User terkait
    await this.prisma.user.updateMany({
      where: { tenantId: id },
      data: {
        ...(updateTenantDto.name ? { name: updateTenantDto.name } : {}),
        ...(updateTenantDto.email ? { email: updateTenantDto.email } : {}),
        ...(updateTenantDto.phone ? { phone: updateTenantDto.phone } : {}),
      },
    });

    return updated;
  }

  async remove(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        contracts: {
          where: { isActive: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    if (tenant.contracts && tenant.contracts.length > 0) {
      throw new BadRequestException('Penyewa ini masih memiliki kontrak sewa yang aktif. Harap check-out/akhiri kontrak sewa terlebih dahulu sebelum menghapus data penyewa.');
    }

    // Hapus akun User login terkait bila ada
    await this.prisma.user.deleteMany({
      where: { tenantId: id },
    });

    // Hapus riwayat kontrak lama bila ada
    await this.prisma.contract.deleteMany({
      where: { tenantId: id },
    });

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
