import {
  Component, Input, HostBinding, OnInit
} from '@angular/core';

import { ToastMessage } from '../../../../dot-core/src/lib/models/toast-message.model';

@Component({
  selector: 'cod-loyalty-view',
  templateUrl: './loyalty-view.component.html',
  styleUrls: ['./loyalty-view.component.scss']
})
export class LoyaltyViewComponent {

  @Input() public data: any;

  @Input() public message: ToastMessage;

  @HostBinding('class.error') public get error(): boolean {
      return (!this.data && this.message) ? this.message.type === 'error' : false;
  }

  @HostBinding('class.info') public get info(): boolean {
      return (!this.data && this.message) ? this.message.type === 'info' : false;
  }

  public get isLittlePoints(): boolean {
      return this.data && this.data.cardBalance >= 1000;
  }

  public get isVeryLittlePoints(): boolean {
      return this.data && this.data.cardBalance >= 10000;
  }

}
