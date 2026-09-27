import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';
import { WebhooksService } from '../webhooks/webhooks.service';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const midtransClient = require('midtrans-client');

@Injectable()
export class PaymentsService {
  private snap: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
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

  /**
   * Cek status pembayaran langsung ke Midtrans API.
   * Sangat berguna untuk localhost development (ketika webhook Midtrans tidak bisa menjangkau localhost).
   */
  async checkPaymentStatus(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return { status: 'paid', isPaid: true, invoice };
    }

    if (!invoice.midtransOrderId) {
      return { status: 'unpaid', isPaid: false, message: 'Belum ada transaksi Midtrans untuk invoice ini.' };
    }

    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    const isProduction = this.configService.get<string>('MIDTRANS_IS_PRODUCTION') === 'true';
    const baseUrl = isProduction
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2';

    if (!serverKey || serverKey.includes('placeholder')) {
      return { status: 'unpaid', isPaid: false, message: 'Kredensial Midtrans belum dikonfigurasi.' };
    }

    try {
      const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');
      const response = await axios.get(`${baseUrl}/${invoice.midtransOrderId}/status`, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
        timeout: 5000,
      });

      // Proses notifikasi status yang didapat dari Midtrans
      const result = await this.webhooksService.handleMidtransNotification(response.data);
      const updatedInvoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
      const isNowPaid = updatedInvoice?.status === InvoiceStatus.PAID;

      return {
        status: result.status,
        isPaid: isNowPaid,
        invoice: updatedInvoice,
      };
    } catch (err: any) {
      return {
        status: 'unpaid',
        isPaid: false,
        message: err.response?.data?.status_message || err.message,
      };
    }
  }
}

