import { Pipe, PipeTransform } from '@angular/core';

import { CODLocalizationService } from '../../../dot-core/src/lib/cod-localization.service';

@Pipe({
    name: 'codNumber'
})
export class NumberPipe implements PipeTransform {

    constructor(private _service: CODLocalizationService) {
    }

    public transform(value: number, decimals?: number): string {
        return this._service.formatNumber(value, decimals);
    }

}
