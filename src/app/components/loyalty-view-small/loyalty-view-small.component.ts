import {
  Component, Input
} from '@angular/core';

@Component({
  selector: 'cod-loyalty-view-small',
  templateUrl: './loyalty-view-small.component.html',
  styleUrls: ['./loyalty-view-small.component.scss']
})
export class LoyaltyViewSmallComponent {

  @Input() public data: any;

}
