import { PrismaClient, RoomStatus, InvoiceStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding KosConnect ERP database...');

  await prisma.invoice.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.room.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  // 1. Akun Pengguna Terdaftar (Users)
  const passwordAdmin = await bcrypt.hash('Admin2026!', 10);
  const passwordRahmat = await bcrypt.hash('Harmoni2026!', 10);
  const passwordFatimah = await bcrypt.hash('Griya2026!', 10);
  const passwordBudi = await bcrypt.hash('Tenant2026!', 10);

  const userAdmin = await prisma.user.create({
    data: {
      email: 'admin@kosconnect.id',
      password: passwordAdmin,
      name: 'Ajis Maulana Shadiq',
      phone: '081234567899',
      role: Role.ADMIN,
      mustChangePassword: false,
    },
  });

  const userRahmat = await prisma.user.create({
    data: {
      email: 'rahmat@kosconnect.id',
      password: passwordRahmat,
      name: 'H. Rahmat Santoso',
      phone: '081298765432',
      role: Role.OWNER,
      mustChangePassword: false,
    },
  });

  const userFatimah = await prisma.user.create({
    data: {
      email: 'fatimah@kosconnect.id',
      password: passwordFatimah,
      name: 'Ibu Hj. Fatimah',
      phone: '082145678901',
      role: Role.OWNER,
      mustChangePassword: false,
    },
  });

  // 2. Properti Terhubung dengan Akun Pemilik Sah (ownerId)
  const propertyHarmoni = await prisma.property.create({
    data: {
      name: 'Kos Harmoni Residence',
      address: 'Jl. Kemang Raya No. 45',
      city: 'Jakarta Selatan',
      ownerId: userRahmat.id,
    },
  });

  const propertyGriya = await prisma.property.create({
    data: {
      name: 'Griya Asri Paviliun',
      address: 'Jl. Dago Asri No. 12',
      city: 'Bandung',
      ownerId: userFatimah.id,
    },
  });

  // 2. Unit Kamar
  const room101 = await prisma.room.create({
    data: {
      propertyId: propertyHarmoni.id,
      roomNumber: '101',
      monthlyPrice: 1800000,
      status: RoomStatus.OCCUPIED,
      facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Kasur Springbed', 'Lemari Pakaian', 'Meja & Kursi Kerja'],
    },
  });

  const room102 = await prisma.room.create({
    data: {
      propertyId: propertyHarmoni.id,
      roomNumber: '102',
      monthlyPrice: 1800000,
      status: RoomStatus.AVAILABLE,
      facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Kasur Springbed', 'Lemari Pakaian'],
    },
  });

  const room103 = await prisma.room.create({
    data: {
      propertyId: propertyHarmoni.id,
      roomNumber: '103',
      monthlyPrice: 2200000,
      status: RoomStatus.AVAILABLE,
      facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Water Heater', 'Smart TV', 'Balkon / Jendela'],
    },
  });

  const roomA1 = await prisma.room.create({
    data: {
      propertyId: propertyGriya.id,
      roomNumber: 'A1',
      monthlyPrice: 1300000,
      status: RoomStatus.OCCUPIED,
      facilities: ['WiFi Cepat', 'Kamar Mandi Dalam', 'Kasur Springbed', 'Lemari Pakaian'],
    },
  });

  const roomA2 = await prisma.room.create({
    data: {
      propertyId: propertyGriya.id,
      roomNumber: 'A2',
      monthlyPrice: 1300000,
      status: RoomStatus.AVAILABLE,
      facilities: ['WiFi Cepat', 'Kamar Mandi Dalam', 'Kasur Springbed', 'Lemari Pakaian'],
    },
  });

  // 3. Penyewa (Tenants)
  const tenantBudi = await prisma.tenant.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi.santoso@example.com',
      phone: '081234567890',
    },
  });

  const userBudi = await prisma.user.create({
    data: {
      email: 'budi@kosconnect.id',
      password: passwordBudi,
      name: 'Budi Santoso',
      phone: '081234567890',
      role: Role.TENANT,
      mustChangePassword: false,
      tenantId: tenantBudi.id,
    },
  });

  const tenantSiti = await prisma.tenant.create({
    data: {
      name: 'Siti Rahma',
      email: 'siti.rahma@example.com',
      phone: '089876543210',
    },
  });

  // 4. Kontrak Sewa (Contracts)
  const now = new Date();
  const nextSixMonths = new Date();
  nextSixMonths.setMonth(now.getMonth() + 6);

  const contractBudi = await prisma.contract.create({
    data: {
      roomId: room101.id,
      tenantId: tenantBudi.id,
      startDate: now,
      endDate: nextSixMonths,
      isActive: true,
    },
  });

  const contractSiti = await prisma.contract.create({
    data: {
      roomId: roomA1.id,
      tenantId: tenantSiti.id,
      startDate: now,
      endDate: nextSixMonths,
      isActive: true,
    },
  });

  // 5. Tagihan (Invoices)
  const dueDateNear = new Date();
  dueDateNear.setDate(now.getDate() + 3);

  // Invoice 1: Lunas (demo status PAID)
  await prisma.invoice.create({
    data: {
      contractId: contractBudi.id,
      invoiceNumber: 'INV-202609-001',
      amount: 1800000,
      dueDate: now,
      status: InvoiceStatus.PAID,
      midtransOrderId: 'ORDER-INV-001-DEMO',
      paidAt: now,
    },
  });

  // Invoice 2: Belum Bayar (demo pembayaran Midtrans Snap & n8n cron check)
  await prisma.invoice.create({
    data: {
      contractId: contractBudi.id,
      invoiceNumber: 'INV-202610-002',
      amount: 1800000,
      dueDate: dueDateNear,
      status: InvoiceStatus.UNPAID,
    },
  });

  // Invoice 3: Belum Bayar (Siti)
  await prisma.invoice.create({
    data: {
      contractId: contractSiti.id,
      invoiceNumber: 'INV-202610-003',
      amount: 1300000,
      dueDate: dueDateNear,
      status: InvoiceStatus.UNPAID,
    },
  });

  console.log('Database seeded successfully with properties, rooms, tenants, contracts, and invoices!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
