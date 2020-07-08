import { Component, OnInit, Input } from '@angular/core';
import { DotButton, DotModifier } from 'dotsdk';
import { AppSettingsService } from '../../../../services';

@Component({
  selector: 'app-order-confirmation-list-button',
  templateUrl: './order-confirmation-list-button.component.html',
  styleUrls: ['./order-confirmation-list-button.component.scss']
})
export class OrderConfirmationListButtonComponent implements OnInit {

  @Input() public button: DotButton;

  constructor(public appSettings: AppSettingsService) { }

  ngOnInit() {
  }

  public get picture(): string {
    return `${this.appSettings.acreBridgeAssets}/Items/${this.button.Picture}`;
  }

  public getSelectedModifiers(modifier: DotModifier) {
    return modifier.Buttons.filter(x => x.Selected).map(x => x.Caption).join('; ');
  }
}
