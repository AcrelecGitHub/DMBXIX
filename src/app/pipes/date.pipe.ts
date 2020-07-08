import { Pipe, PipeTransform } from '@angular/core';

import { CODLocalizationService } from '../../../dot-core/src/lib/cod-localization.service';

@Pipe({
    name: 'codDate'
})
export class DatePipe implements PipeTransform {

    constructor(private _service: CODLocalizationService) {
    }

    public transform(value: Date): string {
        return this._service.formatDate(value);
    }

}
