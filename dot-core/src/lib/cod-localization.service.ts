import { Injectable } from '@angular/core';

import { Log } from './logger/log';
import { CODConfigurationService } from './cod-configuration.service';

export interface LocalizationSettings {
    currencySymbol: string;
    currencySymbolBefore: boolean;
    currencyDecimals: number;
    decimalSeparator: string;
}

export type NumberPart = 'integer' | 'decimals' | 'decimal-separator' | 'signal';
export type CurrencyPart =  NumberPart | 'symbol';

@Injectable({
    providedIn: 'root'
})
export class CODLocalizationService {

    constructor(private configurationService: CODConfigurationService<LocalizationSettings>) {
    }

    public formatNumber(value: number, decimals?: number): string {
        const parts = this.formatNumberToParts(value, decimals);

        const signal = (parts.find(_ => _.type === 'signal') || { value: '' }).value;
        const integerPart = (parts.find(_ => _.type === 'integer') || { value: '' }).value;
        const decimalsPart = (parts.find(_ => _.type === 'decimals') || { value: '' }).value;
        const separator = (parts.find(_ => _.type === 'decimal-separator') || { value: '' }).value;

        return signal + integerPart + separator + decimalsPart;
    }

    public formatNumberToParts(value: number, decimals?: number): { type: NumberPart, value: string }[] {
        const parts = [];
        if (!decimals || decimals < 0) {
            decimals = 0;
        }

        parts.push({ type: 'signal', value: Math.sign(value) < 0 ? '-' : '' });

        const absoluteValue = Math.abs(value);
        const integerPart = decimals > 0 ? Math.floor(absoluteValue) : Math.round(absoluteValue);
        parts.push({ type: 'integer', value: integerPart.toString() });

        if (decimals > 0) {
            const decimalPart = Math.round((absoluteValue - integerPart) * Math.pow(10, decimals));
            parts.push({ type: 'decimals', value: decimalPart.pad(decimals) });
            parts.push({ type: 'decimal-separator', value: this.configurationService.get('decimalSeparator') });
        }

        return parts;
    }

    public formatCurrency(value: number): string {
        const decimals = this.configurationService.get('currencyDecimals');

        const formattedNumber = this.formatNumber(value, decimals);

        const pattern = this.configurationService.get('currencySymbolBefore') ? '{0}{1}' : '{1}{0}';
        return String.compositeFormat(pattern, this.configurationService.get('currencySymbol'), formattedNumber);
    }

    public formatCurrencyToParts(value: number): { type: CurrencyPart, value: string }[] {
        const decimals = this.configurationService.get('currencyDecimals');

        const parts: { type: CurrencyPart, value: string }[] = this.formatNumberToParts(value, decimals);
        parts.push({ type: 'symbol', value: this.configurationService.get('currencySymbol') });

        return parts;
    }

    public formatDate(value: Date, pattern?: string): string {
        if (!pattern) {
            pattern = 'yyyy-MM-dd HH:mm:ss';
        }

        if (!(value  instanceof Date)) {
            return '';
        }

        Log.debug('Formatting date with pattern: {0}', pattern);

        return value.format(pattern);
    }
}
