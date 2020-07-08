import { Component, OnInit, Input } from '@angular/core';
import { AppSettingsService } from '../../services';

import { DotButton, DotPage } from 'dotsdk';

@Component({
  selector: 'app-busy',
  templateUrl: './busy.component.html',
  styleUrls: ['./busy.component.scss']
})
export class BusyTimeComponent implements OnInit {

  @Input() public page: DotPage;
  public title: string;
  public imagePath: string;
  public bgSnacks: string;
  public bgCookie: string;

  public data: Array<any>;

  @Input() public buttons: DotButton[];
  @Input() public showBanner: boolean;

  constructor(
    public appSettings: AppSettingsService
    ) {
  }

  public ngOnInit() {   

    this.title = this.page.Title;
    this.buttons = this.page.Buttons;
    this.imagePath = `${this.appSettings.acreBridgeAssets}/Items/`;
    this.bgSnacks = `${this.appSettings.acreBridgeAssets}/Items/bg__snacks.png`;
    this.bgCookie = this.imagePath+`bg_cookie.png`
  }

  /**
   * 
   */
  public get pageButtons(): DotButton[] {
    return this.page.Buttons;
  }

  public get picture(): string {
    return `${this.appSettings.acreBridgeAssets}/Items/`;
  }

  /**
   * 
   * @param button
   */

}
