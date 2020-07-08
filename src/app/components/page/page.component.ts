import { Component, OnInit, Input } from '@angular/core';
import { DotPage, DotButton } from 'dotsdk';
import { AppSettingsService  } from '../../services';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss']
})
export class PageComponent implements OnInit {

  @Input() public page: DotPage;
  public title: string;
  public imagePath: string;
  public sweetFreshness: string;
  public crispyFreshness: string;

  public data: Array<any>;

  @Input() public buttons: DotButton[];
  @Input() public showBanner: boolean;

  constructor( public appSettings: AppSettingsService ) { }

  public ngOnInit() {   

    this.title = this.page.Title;
    this.buttons = this.page.Buttons;
    this.imagePath = `${this.appSettings.acreBridgeAssets}/Items/`;
    this.sweetFreshness = `${this.appSettings.acreBridgeAssets}/Items/sweetFreshness.png`;
    this.crispyFreshness = `${this.appSettings.acreBridgeAssets}/Items/crispyFreshness.png`;
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
