import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CurrencyService } from './currency.service';

@ApiTags('Currency')
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  @ApiOperation({
    summary: 'Get current USD/IDR exchange rate',
    description: 'Fetches real-time exchange rates from open currency API with in-memory caching.',
  })
  @ApiResponse({ status: 200, description: 'Live exchange rate' })
  async getRates() {
    return this.currencyService.getUsdToIdrRate();
  }

  @Get('convert')
  @ApiOperation({
    summary: 'Convert IDR amount to USD',
    description: 'Converts given IDR amount to USD for international reporting.',
  })
  @ApiQuery({ name: 'amount', required: true, type: Number, example: 1800000 })
  @ApiResponse({ status: 200, description: 'Converted currency calculation' })
  async convert(@Query('amount') amount: number) {
    const amountNum = Number(amount) || 0;
    return this.currencyService.convertIdrToUsd(amountNum);
  }
}
