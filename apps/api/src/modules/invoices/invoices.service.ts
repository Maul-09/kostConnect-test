import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: InvoiceStatus) {
    return this.prisma.invoice.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      include: {
        contract: {
          include: {
            tenant: true,
            room: {
              include: { property: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            tenant: true,
            room: {
              include: { property: true },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async create(createInvoiceDto: CreateInvoiceDto) {
    const { contractId, amount, dueDate, invoiceNumber } = createInvoiceDto;

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    const generatedNumber =
      invoiceNumber ||
      `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(
        1000 + Math.random() * 9000,
      )}`;

    const existing = await this.prisma.invoice.findUnique({
      where: { invoiceNumber: generatedNumber },
    });

    if (existing) {
      throw new ConflictException(`Invoice number ${generatedNumber} already exists`);
    }

    return this.prisma.invoice.create({
      data: {
        contractId,
        invoiceNumber: generatedNumber,
        amount,
        dueDate: new Date(dueDate),
        status: InvoiceStatus.UNPAID,
      },
      include: {
        contract: {
          include: {
            tenant: true,
            room: true,
          },
        },
      },
    });
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    await this.findOne(id);
    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...(updateInvoiceDto.amount !== undefined ? { amount: updateInvoiceDto.amount } : {}),
        ...(updateInvoiceDto.dueDate ? { dueDate: new Date(updateInvoiceDto.dueDate) } : {}),
        ...(updateInvoiceDto.status ? { status: updateInvoiceDto.status } : {}),
        ...(updateInvoiceDto.status === InvoiceStatus.PAID ? { paidAt: new Date() } : {}),
      },
      include: {
        contract: {
          include: {
            tenant: true,
            room: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.invoice.delete({
      where: { id },
    });
  }
}
