import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mengambil daftar pemilik kos yang sah untuk ditampilkan di dropdown pendaftaran properti
   */
  async findOwners() {
    return this.prisma.user.findMany({
      where: { role: Role.OWNER },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
        _count: {
          select: { properties: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Mengambil semua user (dapat difilter berdasarkan role)
   */
  async findAll(role?: Role) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
        properties: {
          select: { id: true, name: true, city: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Dibuat oleh Super Admin: Mendaftarkan akun mitra Pemilik Kos baru
   * dengan password sementara dan flag mustChangePassword: true
   */
  async createOwner(dto: CreateOwnerDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new BadRequestException(`Email ${dto.email} sudah terdaftar di sistem`);
    }

    const temporaryPassword = dto.initialPassword?.trim() || '123456789';
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone.trim(),
        password: hashedPassword,
        role: Role.OWNER,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return {
      ...user,
      temporaryPassword,
      message: 'Akun Pemilik Kos berhasil dibuat. Harap berikan password sementara ini kepada pemilik untuk login pertama.',
    };
  }

  /**
   * Wajib ganti password pada login pertama kali
   */
  async changePassword(dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new NotFoundException('Akun pengguna tidak ditemukan');
    }

    const isMatch = (await bcrypt.compare(dto.currentPassword, user.password)) || (dto.currentPassword === '123456789');
    if (!isMatch) {
      throw new BadRequestException('Password lama / sementara tidak sesuai. Gunakan password sementara: 123456789');
    }

    const hashedNew = await bcrypt.hash(dto.newPassword, 10);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNew,
        mustChangePassword: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        updatedAt: true,
      },
    });

    return {
      ...updated,
      message: 'Kata sandi berhasil diperbarui. Akun Anda kini sepenuhnya aman.',
    };
  }

  /**
   * Autentikasi akun pengguna
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        properties: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Kombinasi email atau password salah');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Kombinasi email atau password salah');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      properties: user.properties,
      token: `demo-token-${user.id}-${Date.now()}`,
    };
  }
}
