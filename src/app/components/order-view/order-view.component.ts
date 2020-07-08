import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  Renderer2
} from '@angular/core';

import { CODOrderView } from '../../../../dot-core/src/lib/models/cod-order-view.model';

@Component({
  selector: 'cod-order-view',
  templateUrl: './order-view.component.html',
  styleUrls: ['./order-view.component.scss']
})
export class OrderViewComponent {

  @Input() public orderView: CODOrderView;

}
