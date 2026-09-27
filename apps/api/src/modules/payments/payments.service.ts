import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const midtransClient = require('midtrans-client');

@Injectable()
export class PaymentsService {
  private snap: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.snap = new midtransClient.Snap({
      isProduction: this.configService.get<string>('MIDTRANS_IS_PRODUCTION') === 'true',
      serverKey: this.configService.get<string>('MIDTRANS_SERVER_KEY') || 'SB-Mid-server-placeholder',
      clientKey: this.configService.get<string>('MIDTRANS_CLIENT_KEY') || 'SB-Mid-client-placeholder',
    });
  }

  getClientKey(): string {
    return this.configService.get<string>('MIDTRANS_CLIENT_KEY') || '';
  }

  async createSnapToken(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contract: {
          include: {
            tenant: true,
            room: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Tagihan ini sudah lunas.');
    }

    const orderId = `ORDER-${invoice.invoiceNumber}-${Date.now().toString().slice(-4)}`;
    const grossAmount = Math.round(Number(invoice.amount));

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: [
        {
          id: invoice.id,
          price: grossAmount,
          quantity: 1,
          name: `Sewa Kamar ${invoice.contract.room.roomNumber}`,
        },
      ],
      customer_details: {
        first_name: invoice.contract.tenant.name,
        email: invoice.contract.tenant.email,
        phone: invoice.contract.tenant.phone,
      },
    };

    try {
      const transaction = await this.snap.createTransaction(parameter);

      // Simpan midtransOrderId ke invoice
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { midtransOrderId: orderId },
      });

      return {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
        orderId,
      };
    } catch (error: any) {
      // Fallback simulasi jika Midtrans Server Key belum dikonfigurasi / tidak valid.
      // PENTING: redirect_url TIDAK di-return agar frontend tidak membuka URL Midtrans
      // yang tidak ada (akan menyebabkan "Transaksi tidak ditemukan").
      // Frontend akan otomatis menggunakan endpoint simulasi internal /webhooks/simulate-payment.
      console.warn('[KosConnect] Midtrans Snap token gagal dibuat — mode simulasi aktif:', error.message);
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { midtransOrderId: orderId },
      });

      return {
        token: null,
        redirect_url: null,
        orderId,
        simulated: true,
      };
    }
  }
}
