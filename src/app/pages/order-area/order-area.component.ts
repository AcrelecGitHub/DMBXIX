import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../model/data.model'
import { AppSettingsService, ContentService, ModernConnectorService } from '../../services';
import { DotPage } from 'dotsdk';
import { PosPropertiesService } from '../../services/pos-properties.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

enum ScreenTypes {
  Page = 'Page',
  Modifiers = 'Modifiers',
  Promos = 'Promos'
}

@Component({
  selector: 'app-order-area',
  templateUrl: './order-area.component.html',
  styleUrls: ['./order-area.component.scss']
})
export class OrderAreaComponent implements OnInit {

  public currentScreen: ScreenTypes;
  public currentPageSides: DotPage;
  public currentPageDesserts: DotPage;
  public currentPageSalads: DotPage;
  public currentPageColdDrinks: DotPage;
  public currentPageHotDrinks: DotPage;
  public currentPageSnacks: DotPage;
  public user$:Observable<User | null>;

  public bannerPath: string;
  public isBusy: boolean;
  public campaignData;
  public metaData;
  public carLeftTrigger;
  public carPresence;
  private timeoutHandler;

  @Input() public showBanner: boolean;

  constructor(private appSettings: AppSettingsService,
              private contentService: ContentService,
              private posPropertiesService: PosPropertiesService,
              private modernConnectorService: ModernConnectorService,
              private http: HttpClient,
              private router: Router,
              private location: Location) { }

  public ngOnInit( ) {

    this.isBusy = false;
    // Update Elog Service with proper values:
    this.posPropertiesService.posConfig.posHeader.updateWith({
      currentLanguageCode: this.appSettings.languageCode
    });
    this.posPropertiesService.posConfig.posHeader.orderStartTime = new Date();
    
    // Set Local variables:
    this.currentScreen = ScreenTypes.Page;
    console.log ("this is the content", this.contentService.mainPage.Buttons);
    // this.currentPage = this.contentService.mainPage;
    this.currentPageSides = this.contentService.getPageByButtonLink('12');
    this.currentPageDesserts = this.contentService.getPageByButtonLink('3');
    this.currentPageSalads = this.contentService.getPageByButtonLink('10');
    this.currentPageColdDrinks = this.contentService.getPageByButtonLink('4');
    this.currentPageHotDrinks = this.contentService.getPageByButtonLink('9');
    this.currentPageSnacks = this.contentService.getPageByButtonLink('11');

    this.bannerPath = `${this.appSettings.acreBridgeAssets}/Banners/banner_odmb.png`;
    this.carBusyFlag();
    this.carStatus();
  }

  // This is to change the template to busy template when Flagship is returning the campaign Flag
  public async carBusyFlag(){
    this.campaignData = await this.http.get<any>(`${this.appSettings.modernConnectorFilesPath}/devices/LANE1/DMB1`).subscribe(data => {      
      const metaData = data;
      const campaigns = metaData.metadata.campaigns;
      if (campaigns) {
        for (const campaign of campaigns) {
          const {
            variation: { modifications }
          } = campaign;
          if (modifications.type === "FLAG") {
            const { value } = modifications;
            if (value.enableBigPicture) {
              this.isBusy = true;
            }
          } else {
            this.isBusy = false;
          }
        }
      }
    });
  }

  public carStatus() {
    this.carLeftTrigger = this.modernConnectorService.listen('metadataUpdated').subscribe((res) => {            
        this.carPresence = res;
        const carSensorState = this.carPresence;
        if (carSensorState.name === "sensorState"){
            if(!carSensorState.value){
              console.log("Car Left COD");
              this.timeoutHandler = setTimeout(() => {
                this.goToWelcome();
              }, 10000);              
            }
        }            
    });
}

  public goToWelcome() {    
    this.router.navigate(['welcome'], {skipLocationChange: true});
    this.location.replaceState('welcome');
  }   

}
