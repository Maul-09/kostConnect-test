import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('midtrans')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Callback webhook listener notifikasi pembayaran dari Midtrans' })
  handleMidtrans(@Body() payload: any) {
    return this.webhooksService.handleMidtransNotification(payload);
  }

  @Post('simulate-payment/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simulasi pelunasan pembayaran instan untuk keperluan demo / review' })
  simulatePayment(@Param('invoiceId') invoiceId: string) {
    return this.webhooksService.handleMidtransNotification({
      order_id: `SIMULATED-${invoiceId}`,
      status_code: '200',
      gross_amount: '1800000',
      signature_key: '',
      transaction_status: 'settlement',
      fraud_status: 'accept',
    });
  }
}
