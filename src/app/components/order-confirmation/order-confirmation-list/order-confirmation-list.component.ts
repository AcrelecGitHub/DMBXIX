import { Component, OnInit, Input } from '@angular/core';
import { DotButton, DotModifier } from 'dotsdk';

@Component({
  selector: 'app-order-confirmation-list',
  templateUrl: './order-confirmation-list.component.html',
  styleUrls: ['./order-confirmation-list.component.scss']
})
export class OrderConfirmationListComponent implements OnInit {

  @Input() public buttons: DotButton[];

  constructor() { }

  ngOnInit() {
  }

}
