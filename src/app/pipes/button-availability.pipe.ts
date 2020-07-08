import { Pipe, PipeTransform } from '@angular/core';
import { DotButton } from 'dotsdk';

@Pipe({
  name: 'buttonAvailability'
})
export class ButtonAvailabilityPipe implements PipeTransform {

  public transform(buttons: DotButton[]): any {
    return buttons.filter(dotButton => {
      // If has Avlb, check it's the rules (for this demo, only working hours!).\
      // If not, return the button.
      if (!dotButton.Avlb) {
        return dotButton;
      }

      // Transform strings to actual minutes:
      const startMinutes = parseInt(dotButton.Avlb.THS.Start.substr(0,2)) * 60 + parseInt(dotButton.Avlb.THS.Start.substr(2,2));
      const endMinutes = parseInt(dotButton.Avlb.THS.Stop.substr(0,2)) * 60 + parseInt(dotButton.Avlb.THS.Stop.substr(2,2));

      // Now:
      const d = new Date();
      const nowInMinutes = d.getHours() * 60 + d.getMinutes();

      // Check if current Butotn should be available or not:
      return startMinutes < nowInMinutes &&  nowInMinutes < endMinutes;
    });
  }

}
