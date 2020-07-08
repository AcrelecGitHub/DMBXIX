import {
  Component, Input
} from '@angular/core';

import { CODProduct } from '../../../../dot-core/src/lib/models/cod-product.model';
import { CODButtonItem } from '../../../../dot-core/src/lib/models/cod-button-item.model';

@Component({
  selector: 'cod-loyalty-item',
  templateUrl: './loyalty-item.component.html',
  styleUrls: ['./loyalty-item.component.scss']
})
export class LoyaltyItemComponent {

  @Input() public product: CODProduct;

  public get image(): string {
      return this.product.media;
  }

  public get title(): string {
      return this.product.name;
  }

  public get showPrice(): boolean {
      return this.product.price.value > 0;
  }

  public get priceType(): 'currency' | 'points' {
      return this.product.price.type;
  }

  public get price(): number {
      return this.product.price.value;
  }
}
