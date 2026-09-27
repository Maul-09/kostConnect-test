import { Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('client-key')
  @ApiOperation({ summary: 'Dapatkan Midtrans Client Key untuk frontend modal Snap' })
  getClientKey() {
    return { clientKey: this.paymentsService.getClientKey() };
  }

  @Post('create-token/:invoiceId')
  @ApiOperation({ summary: 'Generate Midtrans Snap Token untuk pembayaran invoice' })
  createSnapToken(@Param('invoiceId') invoiceId: string) {
    return this.paymentsService.createSnapToken(invoiceId);
  }

  @Get('status/:invoiceId')
  @Post('check-status/:invoiceId')
  @ApiOperation({ summary: 'Cek & sinkronkan status pembayaran langsung dari Midtrans API' })
  checkStatus(@Param('invoiceId') invoiceId: string) {
    return this.paymentsService.checkPaymentStatus(invoiceId);
  }
}

