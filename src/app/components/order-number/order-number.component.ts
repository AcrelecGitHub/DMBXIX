import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-order-number',
  templateUrl: './order-number.component.html',
  styleUrls: ['./order-number.component.scss']
})
export class OrderNumberComponent implements OnInit {

  @Input() public orderNumber: number;
  @Output() public orderClosed: EventEmitter<void> = new EventEmitter();

  constructor() { }

  ngOnInit() {
    setTimeout(x => this.orderClosed.emit(), 5000); // Give it 5 seconds, then emit order closed
  }

}

