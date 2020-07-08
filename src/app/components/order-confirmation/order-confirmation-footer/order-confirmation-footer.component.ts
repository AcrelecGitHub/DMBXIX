import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-order-confirmation-footer',
  templateUrl: './order-confirmation-footer.component.html',
  styleUrls: ['./order-confirmation-footer.component.scss']
})
export class OrderConfirmationFooterComponent implements OnInit {

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
