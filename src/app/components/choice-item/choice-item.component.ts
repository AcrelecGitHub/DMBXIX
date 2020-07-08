import {
  Component, Input
} from '@angular/core';

import {
  CODProduct
} from '../../../../dot-core/src/lib/models/cod-product.model';

@Component({
  selector: 'cod-choice-item',
  templateUrl: './choice-item.component.html',
  styleUrls: ['./choice-item.component.scss']
})
export class ChoiceItemComponent {

  @Input() public product: CODProduct;

  constructor() {
  }

  public get image(): string {
      return this.product.media;
  }

  public get title(): string {
      return this.product.name;
  }
}
