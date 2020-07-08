import {
  Component, Input
} from '@angular/core';

import {
  CODProduct
} from '../../../../dot-core/src/lib/models/cod-product.model';

@Component({
  selector: 'cod-product-item',
  templateUrl: './product-item.component.html',
  styleUrls: ['./product-item.component.scss']
})
export class ProductItemComponent {

  @Input() public product: CODProduct;

  constructor() {
  }

  public get image(): string {
      return this.product.media;
  }

  public get title(): string {
      return this.product.name;
  }

  public get showPrice(): boolean {
      return this.product.price.value > 0;
  }

  public get price(): number {
      return this.product.price.value;
  }

  public get totalFormat(): string {
      return '<b><span style="font-size: 80%; position: relative;">{symbol}</span>{integer}\
      <span style="font-size: 50%; position: relative;" data-value="{decimals}">\
      .{decimals}</span></b>';
  }
}
