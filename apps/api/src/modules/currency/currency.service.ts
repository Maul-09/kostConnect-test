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
  private lastFetched: number = 0;
  private readonly cacheTtlMs = 60 * 60 * 1000; // 1 hour cache TTL

  async getUsdToIdrRate(): Promise<ExchangeRatesResponse> {
    const now = Date.now();

    // Return cached rate if still valid
    if (now - this.lastFetched < this.cacheTtlMs && this.lastFetched > 0) {
      return {
        base: 'USD',
        target: 'IDR',
        rate: this.cachedRate,
        lastUpdated: new Date(this.lastFetched).toISOString(),
        source: 'cache',
      };
    }

    try {
      // Free public Open Exchange Rates API (no auth required)
      const response = await axios.get('https://open.er-api.com/v6/latest/USD', {
        timeout: 5000,
      });

      if (response.data && response.data.rates && response.data.rates.IDR) {
        this.cachedRate = Number(response.data.rates.IDR);
        this.lastFetched = now;
        this.logger.log(`Updated USD/IDR exchange rate from open.er-api: 1 USD = ${this.cachedRate} IDR`);

        return {
          base: 'USD',
          target: 'IDR',
          rate: this.cachedRate,
          lastUpdated: new Date(this.lastFetched).toISOString(),
          source: 'open.er-api.com',
        };
      }
    } catch (err: any) {
      this.logger.warn(`Failed to fetch live exchange rate, falling back to cached default: ${err.message}`);
    }

    return {
      base: 'USD',
      target: 'IDR',
      rate: this.cachedRate,
      lastUpdated: new Date(this.lastFetched || now).toISOString(),
      source: 'fallback',
    };
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
