import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

import { AppSettingsService } from '../../services';
import { DotButton } from 'dotsdk';

@Component({
  selector: 'app-promo-button',
  templateUrl: './promo-button.component.html',
  styleUrls: ['./promo-button.component.scss']
})
export class PromoButtonComponent implements OnInit {

  public variation = {};
  
  @Input() public promoButton: DotButton;
  @Input() public showBanner: boolean;

  constructor(public appSettings: AppSettingsService) { 
    this.appSettings.flagShipData$.subscribe((response) => {
      this.variation = response;
      // console.log("ab-banner", this.variation);
      if (this.variation == "bofmtodi035g0lknbo3g"){
        this.showBanner = false;
      } else if (this.variation == "bofmtodi035g0lknbo40") {
        this.showBanner = true;
      }
    })
  }

  ngOnInit() {
  }

  public get picture(): string {
    return `${this.appSettings.acreBridgeAssets}/Items/img_ac5afdce-07cc-423e-889d-3f12b2ee28bb.png`;
  }

}
