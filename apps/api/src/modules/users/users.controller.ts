import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

@ApiTags('Users & Authentication')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('owners')
  @ApiOperation({ summary: 'Mendapatkan daftar pemilik kos terverifikasi untuk dropdown relasi properti' })
  @ApiResponse({ status: 200, description: 'Daftar pemilik kos terdaftar' })
  findOwners() {
    return this.usersService.findOwners();
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan semua akun pengguna (opsional filter berdasarkan role)' })
  @ApiQuery({ name: 'role', enum: Role, required: false })
  findAll(@Query('role') role?: Role) {
    return this.usersService.findAll(role);
  }

  @Post('owners')
  @ApiOperation({ summary: 'Super Admin: Daftarkan akun mitra Pemilik Kos baru dengan password sementara' })
  @ApiResponse({ status: 201, description: 'Akun pemilik kos berhasil dibuat' })
  createOwner(@Body() dto: CreateOwnerDto) {
    return this.usersService.createOwner(dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Wajib ganti password pada login pertama kali (Force Password Change)' })
  @ApiResponse({ status: 200, description: 'Password baru berhasil disimpan' })
  changePassword(@Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentikasi login akun pengguna (Super Admin, Pemilik Kos, Penyewa)' })
  @ApiResponse({ status: 200, description: 'Login berhasil, mengembalikan profil dan flag mustChangePassword' })
  login(@Body() dto: LoginDto) {
    return this.usersService.login(dto);
  }
}
