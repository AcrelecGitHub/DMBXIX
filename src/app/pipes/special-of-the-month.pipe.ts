import { Pipe, PipeTransform } from '@angular/core';
import { AppSettingsService } from '../services';
import { DotButton } from 'dotsdk';

@Pipe({
  name: 'specialOfTheMonth'
})
export class SpecialOfTheMonthPipe implements PipeTransform {

  constructor(private appSettings: AppSettingsService) {
  }

  transform(buttons: DotButton[]): DotButton[] {

    if (this.appSettings.promotionType === "button") {
      return buttons;
    }
    return buttons.filter(x => x.Link !== 'SPECIAL');
  }

}
