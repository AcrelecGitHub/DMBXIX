import { Pipe, PipeTransform } from '@angular/core';

import { CODLocalizationService } from '../../../dot-core/src/lib/cod-localization.service';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';

@Pipe({
    name: 'codCurrency'
})
export class CurrencyPipe implements PipeTransform {

    constructor(private _service: CODLocalizationService, private _domSanitizer: DomSanitizer) {
    }

    public transform(value: number, format?: string): string | SafeHtml {
        if (format) {
            const parts = this._service.formatCurrencyToParts(value);
            let formattedText = format;
            for (const part of parts) {
                formattedText = formattedText.replaceAll('{' + part.type + '}', part.value);
            }
            return this._domSanitizer.bypassSecurityTrustHtml(formattedText);
        }
        return this._service.formatCurrency(value);
    }
}
