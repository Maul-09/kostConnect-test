import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ExchangeRatesResponse {
  base: string;
  target: string;
  rate: number;
  lastUpdated: string;
  source: string;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private cachedRate: number = 16250; // Fallback sensible default rate (1 USD = 16,250 IDR)
  private lastFetched: number = Date.now();
  private readonly cacheTtlMs = 60 * 60 * 1000; // 1 hour cache TTL
  private isFetching = false;

  async getUsdToIdrRate(): Promise<ExchangeRatesResponse> {
    const now = Date.now();

    // Trigger background refresh if cache is older than TTL and not currently fetching
    if (now - this.lastFetched > this.cacheTtlMs && !this.isFetching) {
      this.refreshRateInBackground();
    }

    return {
      base: 'USD',
      target: 'IDR',
      rate: this.cachedRate,
      lastUpdated: new Date(this.lastFetched).toISOString(),
      source: this.isFetching ? 'cached' : 'live',
    };
  }

  private async refreshRateInBackground(): Promise<void> {
    this.isFetching = true;
    try {
      const response = await axios.get('https://open.er-api.com/v6/latest/USD', {
        timeout: 2500,
      });

      if (response.data && response.data.rates && response.data.rates.IDR) {
        this.cachedRate = Number(response.data.rates.IDR);
        this.lastFetched = Date.now();
        this.logger.log(`Updated USD/IDR exchange rate from open.er-api: 1 USD = ${this.cachedRate} IDR`);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to fetch live exchange rate, using cached fallback: ${err.message}`);
      // Mark as fetched so we don't retry on every single request
      this.lastFetched = Date.now();
    } finally {
      this.isFetching = false;
    }
  }

  async convertIdrToUsd(amountIdr: number): Promise<{
    amountIdr: number;
    amountUsd: number;
    rate: number;
    formattedUsd: string;
  }> {
    const rateInfo = await this.getUsdToIdrRate();
    const amountUsd = Number((amountIdr / rateInfo.rate).toFixed(2));

    return {
      amountIdr,
      amountUsd,
      rate: rateInfo.rate,
      formattedUsd: `$${amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }
}
