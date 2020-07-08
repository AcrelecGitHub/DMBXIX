import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { DotButton } from 'dotsdk';

@Component({
  selector: 'app-order-confirmation',
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.scss']
})
export class OrderConfirmationComponent implements OnInit {

  @Input() public buttons: DotButton[];
  @Input() public subTotal: number;
  @Input() public tax: number;
  @Input() public total: number;

  @Output() public continueOrderClicked: EventEmitter<void> = new EventEmitter();
  @Output() public payOrderClicked: EventEmitter<void> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }


  public onContinueOrderClicked() {
    this.continueOrderClicked.emit();
  }

  public onPayOrderClicked() {
    this.payOrderClicked.emit();
  }

}
