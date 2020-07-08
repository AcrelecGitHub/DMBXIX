import {
  Component, Input, HostBinding
} from '@angular/core';

import { Socket } from 'ngx-socket-io';

import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'cod-order-item',
  templateUrl: './order-item.component.html',
  styleUrls: ['./order-item.component.scss'],
  animations: [
      trigger('active', [
          transition(':enter', [
              style({ 'clip-path': 'polygon(100% 0, 100% 100%, 100% 100%, 100% 0)', background: '#ee7700' }),
              animate('800ms ease-in-out', style({'clip-path': 'polygon(100% 0, 100% 100%, 0 100%, 0 0)', background: '#ee7700' })),
              animate('800ms ease-in-out', style({ background: '*' }))
          ])
      ]),
      trigger('quantity', [
          transition(':increment', [
              style({ background: '*' }),
              animate('400ms ease-in-out', style({ background: '#ee7700' })),
              animate('400ms ease-in-out', style({ background: '*' }))
          ])
      ])
  ]
})
export class OrderItemComponent {

  @Input() public orderItem;
  public items;
  constructor(private socket: Socket) { 
  }

  @HostBinding('@active')
  public get active(): boolean {
      return true;
  }

  @HostBinding('@quantity')
  public get quantity(): number {
      if (!this.orderItem) {
          return 0;
      }
      return this.orderItem.quantity;
  }

}
