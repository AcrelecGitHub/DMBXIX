import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DotButton } from 'dotsdk';

@Component({
  selector: 'app-buttons-list',
  templateUrl: './buttons-list.component.html',
  styleUrls: ['./buttons-list.component.scss'],
})
export class ButtonsListComponent implements OnInit {

  @Input() public buttons: DotButton[];
  @Input() public showBanner: boolean;

  constructor() { }

  ngOnInit() {
    this.showBanner;
  }

}
