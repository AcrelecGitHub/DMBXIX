import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ModernConnectorService } from '../../services';
import { PosServingLocation, DotPage, DotBannersLoader } from 'dotsdk';

@Component({
  selector: 'cod-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {

  public deviceType: string;
  public variationID: string;
  public promotionType: string;
  public currentPage: DotPage;

  public metaData;
  public items;
  public newData;
  public carSensor: boolean;

  @Input() public language: string;
  @Output() public serviceTypeSelected: EventEmitter<PosServingLocation> = new EventEmitter();

  constructor(
    private router: Router,
    private location: Location,
    private modernConnectorService: ModernConnectorService
    ) { }

  banners = DotBannersLoader.getInstance().loadedModel;
  
  public async ngOnInit() {
    this.getMetaData();
  }

  public getMetaData() {
    this.modernConnectorService.listen('metadataUpdated').subscribe((res) => {
      console.log("MetaData",res);
      this.carSensor = true;
      this.goToNextPage();
    });
  }

  public ngOnDestroy() {
  }

  public goToNextPage() {
    if (this.carSensor === true){   
      this.router.navigate(['orderarea'], { skipLocationChange: true });
      this.location.replaceState('orderarea');
    }
  }
}
