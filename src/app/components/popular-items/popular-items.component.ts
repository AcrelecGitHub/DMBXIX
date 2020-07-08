import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DotPage, DotButton } from 'dotsdk';
import { HttpClient } from '@angular/common/http'
;import { RecommendationsService } from '../../services/recommendations.service';
import { Subject } from 'rxjs';
import { takeWhile, takeUntil } from 'rxjs/operators';

import { ContentService, AppSettingsService } from '../../services';

@Component({
  selector: 'app-popular-items',
  templateUrl: './popular-items.component.html',
  styleUrls: ['./popular-items.component.scss']
})
export class PopularItemsComponent implements OnInit {
  private recommendations: DotButton[] = [];
  private populars: DotButton[] = [];

  private unsubscribe: Subject<void> = new Subject();
  public popButtons: DotButton[];
  public page: DotPage[];
  popularButtons: DotButton[];
  private modernConnecterData;


  public data: Array<any>;

  constructor(private contentService: ContentService, 
    private appSettings: AppSettingsService, 
    private http: HttpClient, 
    private readonly recommendationsService: RecommendationsService
    ) {
      this.recommendationsService.recommendationUpdated.pipe(takeUntil(this.unsubscribe)).subscribe((recommendations) => {
      this.recommendations = recommendations;
    });
    this.recommendationsService.popularsItemsUpdated.pipe(takeUntil(this.unsubscribe)).subscribe((populars) => {
      if (populars && populars.length > 0 ){
        this.populars = populars;
      }
    });
  }
  public get showRecommendations(): boolean {
    return this.recommendations.length > 0;
  }

  public get showPopulars(): boolean {
    return this.populars && this.populars.length > 0;
  }
  imagePath = `${this.appSettings.acreBridgeAssets}/Items/`;

  ngOnInit() {
    this.popularButtons = this.buttons;

    this.http.get<any>('http://localhost:9426/bridge/files').subscribe(data => {
            this.modernConnecterData = data;
            // console.log("Pages", this.modernConnecterData);
    });
  }

  public ngAfterViewChecked() { 
    this.populars;
  }

  public get buttons() {
    return this.contentService.mainPage.Buttons;
  }
  
}