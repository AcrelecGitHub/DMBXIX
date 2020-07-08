import { Injectable } from '@angular/core';

import { Log } from './logger/log';
import { ConfigurationService } from './configuration.service';
import { HooksIdentifiers } from './hook-manager/hooks-identifiers';
import { Hookable } from './decorators/hookable.decorator';

@Injectable({
    providedIn: 'root'
})
export class LocalizationService {

    constructor(private configurationService: ConfigurationService) { }

    @Hookable(HooksIdentifiers.FORMAT_NUMBER)
    public formatNumber(value: number, decimals?: number): string {
        const signal = Math.sign(value) < 0 ? '-' : '';
        const absoluteValue = Math.abs(value);

        if (!decimals || decimals < 0) {
            decimals = 0;
        }

        const integerPart = decimals > 0 ? Math.floor(absoluteValue) : Math.round(absoluteValue);
        // const formattedIntegerPart = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, this.data.thousandSeparator);
        const formattedIntegerPart = integerPart.toString();

        if (decimals === 0) {
            return signal + formattedIntegerPart;
        } else {
            const decimalPart = Math.round((absoluteValue - integerPart) * Math.pow(10, decimals));
            const formattedDecimalPart = decimalPart.pad(decimals);
            return signal + formattedIntegerPart + this.configurationService.decimalSeparator + formattedDecimalPart;
        }
    }

    @Hookable(HooksIdentifiers.FORMAT_CURRENCY)
    public formatCurrency(value: number): string {
        let decimals = 2;

        if (this.configurationService.currencySymbol === '元') {
            decimals = 1;
        }

        if (this.configurationService.currencySymbol === 'KR') {
            decimals = 0;
        }

        const formattedNumber = this.formatNumber(value / 100, decimals);

        const pattern = this.configurationService.curencySymbolBefore ? '{0}{1}' : '{1}{0}';
        return String.compositeFormat(pattern, this.configurationService.currencySymbol, formattedNumber);
    }

    @Hookable(HooksIdentifiers.FORMAT_DATE)
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

    /**
     * @deprecated Use the 'formatNumber' method instead
     */
    public formatDecimals(value, decimals): string {
        return this.formatNumber(value, decimals);
    }

    /**
     * @deprecated Use the 'formatCurrency' method instead
     */
    public returnFormatPrice(formattedNumber: string): string {
        const pattern = this.configurationService.curencySymbolBefore ? '{0} {1}' : '{1} {0}';
        return String.compositeFormat(pattern, this.configurationService.currencySymbol, formattedNumber);
    }
}
