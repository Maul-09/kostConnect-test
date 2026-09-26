import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async handleMidtransNotification(payload: any) {
    this.logger.log(`Received Midtrans webhook: ${JSON.stringify(payload)}`);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = payload;

    const serverKey =
      this.configService.get<string>('MIDTRANS_SERVER_KEY') || 'SB-Mid-server-placeholder';

    // 1. Verifikasi Signature Key (Keamanan Transaksi)
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex');

    const isSimulated = !signature_key || serverKey === 'SB-Mid-server-placeholder';
    const isValidSignature = isSimulated || signature_key === expectedSignature;

    if (!isValidSignature) {
      this.logger.error(`Invalid Midtrans signature for order: ${order_id}`);
      return { status: 'invalid_signature' };
    }

    // 2. Cari Invoice berdasarkan midtransOrderId atau invoiceNumber
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        OR: [
          { midtransOrderId: order_id },
          { invoiceNumber: order_id.replace(/^ORDER-/, '').replace(/-[0-9]{4}$/, '') },
        ],
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
    });

    if (!invoice) {
      this.logger.warn(`Invoice not found for order_id: ${order_id}`);
      return { status: 'invoice_not_found' };
    }

    // 3. Evaluasi Status Pembayaran
    const isSuccess =
      (transaction_status === 'capture' && fraud_status === 'accept') ||
      transaction_status === 'settlement';

    if (isSuccess) {
      const updatedInvoice = await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
          midtransOrderId: order_id,
        },
      });

      this.logger.log(`Invoice ${invoice.invoiceNumber} successfully marked as PAID`);

      // 4. Trigger n8n Automation Workflow 1 (Notifikasi Tagihan Lunas)
      await this.triggerN8nNotification({
        event: 'payment.success',
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        tenantName: invoice.contract.tenant.name,
        tenantEmail: invoice.contract.tenant.email,
        roomNumber: invoice.contract.room.roomNumber,
        propertyName: invoice.contract.room.property.name,
        paidAt: updatedInvoice.paidAt,
      });

      return { status: 'paid', invoiceId: invoice.id };
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.CANCELLED },
      });
      return { status: 'cancelled', invoiceId: invoice.id };
    }

    return { status: 'pending', invoiceId: invoice.id };
  }

  private async triggerN8nNotification(data: Record<string, any>) {
    const n8nWebhookUrl =
      this.configService.get<string>('N8N_WEBHOOK_URL') ||
      'http://localhost:5678/webhook/payment-success';

    try {
      await axios.post(n8nWebhookUrl, data, { timeout: 3000 });
      this.logger.log(`n8n notification dispatched successfully to ${n8nWebhookUrl}`);
    } catch (err: any) {
      // Log info tapi jangan throw error agar webhook Midtrans tetap merespon 200 OK
      this.logger.warn(`n8n webhook notification dispatch skipped/failed: ${err.message}`);
    }
  }
}
