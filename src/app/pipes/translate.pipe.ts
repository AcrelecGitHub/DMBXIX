import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { CODInternationalizationService } from '../../../dot-core/src/lib/cod-internationalization.service';

@Pipe({
    name: 'codTranslate',
    pure: false
})
export class TranslatePipe implements PipeTransform {

    constructor(private _service: CODInternationalizationService,
        private _domSanitizer: DomSanitizer) {
    }

    public transform(value: string, ...args: any[]): SafeHtml {
        const formattedText = this._service.translate(value, ...args);
        return this._domSanitizer.bypassSecurityTrustHtml(formattedText);
    }

}
